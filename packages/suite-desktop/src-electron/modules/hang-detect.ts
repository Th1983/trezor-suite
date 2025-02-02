import fs from 'fs';
import path from 'path';
import { dialog } from 'electron';
import { app, ipcMain } from '../typed-electron';
import { Module } from './index';

const HANG_WAIT = 30000;

const init: Module = ({ mainWindow }) => {
    const { logger } = global;

    let isReady = false;
    const hangHandler = async () => {
        if (isReady) {
            return;
        }

        logger.warn('hang-detect', 'content is not loading');
        const resp = await dialog.showMessageBox(mainWindow, {
            type: 'warning',
            message: 'The application seems to be hanging...',
            buttons: ['Wait', 'Quit', 'Clear cache & restart'],
        });

        switch (resp.response) {
            // Wait
            case 0:
                logger.info('hang-detect', 'Delaying check');
                setTimeout(hangHandler, HANG_WAIT);
                break;
            // Quit
            case 1:
                logger.info('hang-detect', 'Quitting app');
                app.quit();
                break;
            // Clear cache & restart
            case 2: {
                const appFolder = process.env.PKGNAME!.replace('/', path.sep);
                const cachePath = path.join(app.getPath('appData'), appFolder, 'Cache');

                logger.info('hang-detect', `Deleting cache at ${cachePath}`);
                fs.rm(cachePath, { recursive: true }, err => {
                    if (err) {
                        logger.error('hang-detect', `Couldn't clear cache: ${err.message}`);
                    }

                    app.relaunch();
                    app.quit();
                });
                break;
            }
            // no default
        }
    };

    setTimeout(hangHandler, HANG_WAIT);

    ipcMain.on('client/ready', () => {
        logger.debug('hang-detect', 'Client ready');
        isReady = true;
    });
};

export default init;
