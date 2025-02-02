import { composeTx } from '../src';
import * as utils from '../src/compose/utils';
import { Permutation } from '../src/compose/permutation';
import { reverseBuffer } from '../src/bufferutils';
import * as NETWORKS from '../src/networks';

import { verifyTxBytes } from './compose.utils';
import fixtures from './__fixtures__/compose';
import fixturesCrossCheck from './__fixtures__/compose.crosscheck';

// keyof typeof NETWORKS;
const getNetwork = (name?: string) =>
    // @ts-ignore expression of type string can't be used to index type
    typeof name === 'string' && NETWORKS[name] ? NETWORKS[name] : NETWORKS.bitcoin;

describe('composeTx', () => {
    fixtures.forEach(f => {
        const network = getNetwork(f.request.network);
        const request = { ...f.request, network };
        const result: any = { ...f.result };
        it(f.description, () => {
            if (result.transaction) {
                result.transaction.inputs.forEach((oinput: any) => {
                    const input = oinput;
                    input.hash = reverseBuffer(Buffer.from(input.REV_hash, 'hex'));
                    delete input.REV_hash;
                });
                const o = result.transaction.PERM_outputs;
                const sorted = JSON.parse(JSON.stringify(o.sorted));
                sorted.forEach((ss: any) => {
                    const s = ss;
                    if (s.opReturnData != null) {
                        s.opReturnData = Buffer.from(s.opReturnData);
                    }
                });
                result.transaction.outputs = new Permutation(sorted, o.permutation);
                delete result.transaction.PERM_outputs;
            }

            const tx = composeTx(request as any);
            expect(tx).toEqual(result);

            if (tx.type === 'final') {
                verifyTxBytes(tx, f.request.txType as any, network);
            }
        });
    });
});

describe('composeTx addresses cross-check', () => {
    const txTypes = ['p2pkh', 'p2sh', 'p2tr', 'p2wpkh'] as const;
    const addrTypes = {
        p2pkh: '1BitcoinEaterAddressDontSendf59kuE',
        p2sh: '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr',
        p2tr: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
        p2wpkh: 'bc1qafk4yhqvj4wep57m62dgrmutldusqde8adh20d',
        p2wsh: 'bc1q6rgl33d3s9dugudw7n68yrryajkr3ha9q8q24j20zs62se4q9tsqdy0t2q',
    };
    const addrKeys = Object.keys(addrTypes) as Array<keyof typeof addrTypes>;
    fixturesCrossCheck.forEach(f => {
        txTypes.forEach(txType => {
            // skip test for each addressType if there is nothing to replace (example: 7 inputs test)
            const offset = f.request.outputs.find(o => o.address === 'replace-me')
                ? addrKeys.length
                : 1;

            addrKeys.slice(0, offset).forEach(addressType => {
                const key = `${txType}-${addressType}` as keyof typeof f.result;
                it(`${key} ${f.description}`, () => {
                    const tx = composeTx({
                        ...f.request,
                        network: NETWORKS.bitcoin,
                        txType,
                        changeType: 'PAYTOADDRESS',
                        outputs: f.request.outputs.map(o => {
                            if (o.type === 'complete') {
                                return {
                                    ...o,
                                    address:
                                        o.address === 'replace-me'
                                            ? addrTypes[addressType]
                                            : addrTypes[o.address as keyof typeof addrTypes] ||
                                              o.address,
                                };
                            }
                            return o;
                        }),
                    } as any);

                    if (tx.type !== 'final') throw new Error('Not final transaction!');

                    expect(tx).toMatchObject(f.result[key]);

                    expect(tx.transaction.inputs.length).toEqual(f.request.utxos.length);

                    verifyTxBytes(tx, txType);
                });
            });
        });
    });
});

describe('compose/utils', () => {
    it('convertFeeRate', () => {
        // valid
        expect(utils.convertFeeRate('1')).toEqual(1);
        expect(utils.convertFeeRate('1.1')).toEqual(1.1);
        expect(utils.convertFeeRate(1)).toEqual(1);
        expect(utils.convertFeeRate(1.1)).toEqual(1.1);

        // invalid
        expect(utils.convertFeeRate(Number.MAX_SAFE_INTEGER + 1)).toBeUndefined();
        expect(utils.convertFeeRate('9007199254740992')).toBeUndefined(); // Number.MAX_SAFE_INTEGER + 1 as string
        expect(utils.convertFeeRate('-1')).toBeUndefined();
        expect(utils.convertFeeRate('-1')).toBeUndefined();
        expect(utils.convertFeeRate('aaa')).toBeUndefined();
        expect(utils.convertFeeRate('')).toBeUndefined();
        expect(utils.convertFeeRate(-1)).toBeUndefined();
        expect(utils.convertFeeRate(0)).toBeUndefined();
        expect(utils.convertFeeRate('0')).toBeUndefined();
        expect(utils.convertFeeRate(NaN)).toBeUndefined();
        expect(utils.convertFeeRate(Infinity)).toBeUndefined();
        // @ts-expect-error invalid arg
        expect(utils.convertFeeRate()).toBeUndefined();
        // @ts-expect-error invalid arg
        expect(utils.convertFeeRate(null)).toBeUndefined();
    });
});
