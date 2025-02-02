// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/FirmwareUpdate.js

import { getBinary } from './firmware/getBinary';
import { modifyFirmware } from './firmware/modifyFirmware';
import { AbstractMethod } from '../core/AbstractMethod';
import { ERRORS } from '../constants';
import { UI, createUiMessage } from '../events';
import { uploadFirmware } from './management/uploadFirmware';
import { validateParams } from './common/paramsValidator';
import { getReleases } from '../data/firmwareInfo';
import { isStrictFeatures } from '../utils/firmwareUtils';

type Params = {
    binary?: ArrayBuffer;
    version?: number[];
    btcOnly?: boolean;
    baseUrl?: string;
    intermediary?: boolean;
};

export default class FirmwareUpdate extends AbstractMethod<'firmwareUpdate', Params> {
    init() {
        this.useEmptyPassphrase = true;
        this.requiredPermissions = ['management'];
        this.allowDeviceMode = [UI.BOOTLOADER, UI.INITIALIZE];
        this.requireDeviceMode = [UI.BOOTLOADER];
        this.useDeviceState = false;
        this.skipFirmwareCheck = true;

        const { payload } = this;

        validateParams(payload, [
            { name: 'version', type: 'array' },
            { name: 'btcOnly', type: 'boolean' },
            { name: 'baseUrl', type: 'string' },
            { name: 'binary', type: 'array-buffer' },
            { name: 'intermediary', type: 'boolean' },
        ]);

        if ('version' in payload) {
            this.params = {
                // either receive version and btcOnly
                version: payload.version,
                btcOnly: payload.btcOnly,
                baseUrl: payload.baseUrl || 'https://data.trezor.io',
                intermediary: payload.intermediary,
            };
        }

        if ('binary' in payload) {
            // or binary
            this.params = {
                ...this.params,
                binary: payload.binary,
            };
        }
    }

    async confirmation() {
        // wait for popup window
        await this.getPopupPromise().promise;
        // initialize user response promise
        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION);

        // request confirmation view
        this.postMessage(
            createUiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'device-management',
                customConfirmButton: {
                    className: 'wipe',
                    label: 'Proceed',
                },
                label: 'Do you want to update firmware? Never do this without your recovery card.',
            }),
        );

        // wait for user action
        const uiResp = await uiPromise.promise;
        return uiResp.payload;
    }

    async run() {
        const { device, params } = this;

        let binary: ArrayBuffer;
        try {
            if (params.binary) {
                if (!isStrictFeatures(device.features)) {
                    throw new Error('Features of unexpected shape provided');
                }

                binary = modifyFirmware({
                    fw: params.binary,
                    features: device.features,
                });
            } else {
                const firmware = await getBinary({
                    // features and releases are used for sanity checking
                    features: device.features,
                    releases: getReleases(device.features.major_version),
                    // version argument is used to find and fetch concrete release from releases list
                    version: params.version,
                    btcOnly: params.btcOnly,
                    baseUrl: params.baseUrl!,
                    intermediary: params.intermediary,
                });
                binary = firmware.binary;
            }
        } catch (err) {
            throw ERRORS.TypedError(
                'Method_FirmwareUpdate_DownloadFailed',
                'Failed to download firmware binary',
            );
        }

        return uploadFirmware(
            this.device.getCommands().typedCall.bind(this.device.getCommands()),
            this.postMessage,
            device,
            { payload: binary },
        );
    }
}
