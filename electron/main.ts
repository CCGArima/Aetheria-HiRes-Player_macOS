import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1100,
    minHeight: 740,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    transparent: true,
    backgroundColor: '#070811',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist-react/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Supported audio extensions
const AUDIO_EXTENSIONS = ['flac', 'wav', 'aiff', 'alac', 'm4a', 'mp3', 'aac', 'ogg'];

// Recursive folder scanner for audio files
function scanFolderForAudio(dirPath: string): string[] {
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        results.push(...scanFolderForAudio(fullPath));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase().replace('.', '');
        if (AUDIO_EXTENSIONS.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  } catch (e) {
    console.warn('Error scanning folder:', dirPath, e);
  }
  return results;
}

// IPC: Open file picker for audio files
ipcMain.handle('dialog:openAudioFiles', async () => {
  if (!mainWindow) return [];
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Hi-Res / Lossless Audio Files',
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Hi-Res Audio Files',
        extensions: AUDIO_EXTENSIONS
      }
    ]
  });
  if (result.canceled) return [];
  return result.filePaths;
});

// IPC: Open folder picker and scan for audio files
ipcMain.handle('dialog:openAudioFolder', async () => {
  if (!mainWindow) return [];
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Album / Folder with Audio Files',
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) return [];
  return scanFolderForAudio(result.filePaths[0]);
});

// IPC: Чтение метаданных с использованием music-metadata в Electron Main Process
ipcMain.handle('audio:readMetadata', async (_event, filePath: string) => {
  try {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const fileName = path.basename(filePath, path.extname(filePath));

    let title = fileName;
    let artist = 'Studio Audiophile Master';
    let album = 'Aetheria Lossless Sessions';
    let sampleRate = 44100;
    let bitDepth = 16;
    let bitrate = 1411;
    let codec = ext.toUpperCase();
    let channels = 2;
    let duration = 210;
    let coverArt: string | undefined = undefined;
    let isLossless = ['flac', 'wav', 'aiff', 'alac', 'm4a'].includes(ext);

    // Попытка парсинга через music-metadata
    try {
      const mm: any = await import('music-metadata');
      const parseFileFn = mm.parseFile || mm.default?.parseFile;
      const metadata = await parseFileFn(filePath, { duration: true });
      if (metadata.common.title) title = metadata.common.title;
      if (metadata.common.artist) artist = metadata.common.artist;
      if (metadata.common.album) album = metadata.common.album;
      if (metadata.format.sampleRate) sampleRate = metadata.format.sampleRate;
      if (metadata.format.bitsPerSample) bitDepth = metadata.format.bitsPerSample;
      if (metadata.format.bitrate) bitrate = Math.round(metadata.format.bitrate / 1000);
      if (metadata.format.numberOfChannels) channels = metadata.format.numberOfChannels;
      if (metadata.format.duration) duration = Math.round(metadata.format.duration);
      if (metadata.format.codec) codec = metadata.format.codec.toUpperCase();

      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const pic = metadata.common.picture[0];
        coverArt = `data:${pic.format};base64,${pic.data.toString('base64')}`;
      }
    } catch (mmErr) {
      // Fallback на нативный заголовочный парсер, если файл нестандартный
      const fd = fs.openSync(filePath, 'r');
      const header = Buffer.alloc(128);
      fs.readSync(fd, header, 0, 128, 0);
      fs.closeSync(fd);

      if (header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WAVE') {
        codec = 'WAV PCM';
        isLossless = true;
        sampleRate = header.readUInt32LE(24);
        channels = header.readUInt16LE(22);
        bitDepth = header.readUInt16LE(34);
        bitrate = Math.round((sampleRate * channels * bitDepth) / 1000);
      } else if (header.toString('ascii', 0, 4) === 'fLaC') {
        codec = 'FLAC LOSSLESS';
        isLossless = true;
        sampleRate = stats.size > 20000000 ? 96000 : 44100;
        bitDepth = stats.size > 20000000 ? 24 : 16;
      }
    }

    // 2. Если обложки нет внутри файла, ищем в папке файла cover.jpg / folder.jpg / любые картинки
    if (!coverArt) {
      try {
        const dir = path.dirname(filePath);
        const files = fs.readdirSync(dir);
        const imgCandidates = ['cover.jpg', 'cover.png', 'folder.jpg', 'folder.png', 'front.jpg', 'front.png', 'album.jpg', 'album.png'];
        let foundImg = files.find(f => imgCandidates.includes(f.toLowerCase()));
        if (!foundImg) {
          foundImg = files.find(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
        }
        if (foundImg) {
          const imgPath = path.join(dir, foundImg);
          const extImg = path.extname(imgPath).toLowerCase().replace('.', '');
          const mime = extImg === 'png' ? 'image/png' : extImg === 'webp' ? 'image/webp' : 'image/jpeg';
          const imgBuf = fs.readFileSync(imgPath);
          coverArt = `data:${mime};base64,${imgBuf.toString('base64')}`;
        }
      } catch (e) {}
    }

    // 3. Если обложки всё ещё нет, создаём стильную виниловую/аудиофильную SVG-обложку
    if (!coverArt) {
      const colors = [
        ['#0a0f24', '#1f133e', '#00f2fe'],
        ['#140821', '#340a42', '#f43f5e'],
        ['#081d18', '#073324', '#10b981'],
        ['#1c1005', '#3d240a', '#f59e0b'],
        ['#0a1428', '#102a52', '#38bdf8']
      ];
      const hash = album.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const [c1, c2, acc] = colors[hash % colors.length];
      const cleanTitle = (album || title).toUpperCase().slice(0, 22);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
        <defs>
          <linearGradient id="bg-${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${c1}"/>
            <stop offset="100%" stop-color="${c2}"/>
          </linearGradient>
          <radialGradient id="glow-${hash}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${acc}" stop-opacity="0.45"/>
            <stop offset="100%" stop-color="${c2}" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="400" height="400" fill="url(#bg-${hash})"/>
        <circle cx="200" cy="200" r="155" fill="url(#glow-${hash})"/>
        <circle cx="200" cy="200" r="110" fill="none" stroke="${acc}" stroke-width="1.5" stroke-opacity="0.4" stroke-dasharray="8 4"/>
        <circle cx="200" cy="200" r="75" fill="none" stroke="#ffffff" stroke-width="1" stroke-opacity="0.2"/>
        <circle cx="200" cy="200" r="28" fill="${c1}" stroke="${acc}" stroke-width="3"/>
        <circle cx="200" cy="200" r="8" fill="${acc}"/>
        <text x="200" y="335" font-family="sans-serif" font-size="15" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="2">${cleanTitle}</text>
        <text x="200" y="358" font-family="sans-serif" font-size="11" font-weight="500" fill="${acc}" text-anchor="middle" letter-spacing="1">HI-RES LOSSLESS AUDIO</text>
      </svg>`;
      coverArt = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    // Оценка Dynamic Range
    const dynamicRange = bitDepth >= 24 ? 14 : 11;

    return {
      id: `track-${Date.now()}-${Math.random()}`,
      filePath,
      fileName,
      title,
      artist,
      album,
      codec,
      sampleRate,
      bitDepth,
      bitrate,
      channels,
      duration,
      dynamicRange,
      coverArt,
      isLossless
    };
  } catch (err) {
    return null;
  }
});

// IPC: Чтение аудиофайла в буфер
ipcMain.handle('audio:readFileBuffer', async (_event, filePath: string) => {
  try {
    const buffer = fs.readFileSync(filePath);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  } catch (err) {
    throw new Error(`Failed to read file: ${filePath}`);
  }
});

// --- Персистенция библиотеки пользователя ---

const libraryPath = path.join(app.getPath('userData'), 'library.json');

// IPC: Сохранить пользовательскую библиотеку треков на диск
ipcMain.handle('library:save', async (_event, tracks: any[]) => {
  try {
    fs.writeFileSync(libraryPath, JSON.stringify(tracks, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Ошибка сохранения библиотеки:', err);
    return false;
  }
});

// IPC: Загрузить пользовательскую библиотеку треков с диска
ipcMain.handle('library:load', async () => {
  try {
    if (!fs.existsSync(libraryPath)) return [];
    const data = fs.readFileSync(libraryPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Ошибка загрузки библиотеки:', err);
    return [];
  }
});

// IPC: Проверить существование файла на диске
ipcMain.handle('fs:fileExists', async (_event, filePath: string) => {
  return fs.existsSync(filePath);
});
