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

// IPC: Открыть диалог выбора аудиофайлов macOS
ipcMain.handle('dialog:openAudioFiles', async () => {
  if (!mainWindow) return [];
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Выбрать аудиофайлы Hi-Res / Lossless',
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Hi-Res Audio Files',
        extensions: ['flac', 'wav', 'aiff', 'alac', 'm4a', 'mp3', 'aac', 'ogg']
      }
    ]
  });
  if (result.canceled) return [];
  return result.filePaths;
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
      const mm = await import('music-metadata');
      const metadata = await mm.parseFile(filePath, { duration: true });
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
