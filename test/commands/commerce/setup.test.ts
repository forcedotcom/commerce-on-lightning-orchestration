/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// import { strict as assert } from 'assert';
// import { StubbedType, stubInterface } from '@salesforce/ts-sinon';
// import { $$ } from '@salesforce/command/lib/test';
// import { UX } from '@salesforce/command';
// import { IConfig } from '@oclif/config';
// import sinon, { stub } from 'sinon';
// import { fs } from '@salesforce/core';
// import { Setup } from '../../../src/commands/commerce/setup';
// import { Requires } from '../../../src/lib/utils/requires';
// import { DevhubAuth } from '../../../src/commands/commerce/devhub/auth';
// import { ScratchOrgCreate } from '../../../src/commands/commerce/scratchorg/create';
// import { B_DIR } from '../../../src/lib/utils/constants/properties';

describe('commerce:setup', () => {
  // const config = stubInterface<IConfig>($$.SANDBOX, {});
  // let uxStub: StubbedType<UX>;
  // let d;
  // let devhub;
  // let scratchOrg;
  // let store;
  // async function createNewSetupCommand(flags: Record<string, string | boolean> = {}): Promise<Setup> {
  //   uxStub = stubInterface<UX>($$.SANDBOX);
  //
  //   const login = new Setup([], config);
  //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //   // @ts-ignore because protected member
  //   login.ux = uxStub;
  //   const fl = {};
  //   const s = Setup.flags;
  //   // eslint-disable-next-line guard-for-in,@typescript-eslint/no-for-in-array,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-return
  //   Object.keys(s)
  //     .filter((k) => s[k].default)
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-return
  //     .forEach((k) => (fl[k] = s[k].default));
  //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //   // @ts-ignore because protected member
  //   login.flags = Object.assign(fl, flags);
  //   return login;
  // }
  // beforeEach(() => {
  //   d = stub(Requires, 'default').returns(new Requires());
  //   devhub = stub(DevhubAuth, 'run').resolves({ a: '' });
  //   scratchOrg = stub(ScratchOrgCreate, 'run').resolves({ b: '' });
  // });
  // afterEach(() => {
  //   sinon.restore();
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  //   d.restore();
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  //   devhub.restore();
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  //   scratchOrg.restore();
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  //   // store.restore();
  // });
  // async function setupSetup(name: string, data = {}, dd = 0, sc = 0, st = 0) {
  //   const tFile = B_DIR + `/devhub-configuration.test.${name}.json`;
  //   fs.writeJsonSync(tFile, data);
  //   try {
  //     await (await createNewSetupCommand({ configuration: tFile })).run();
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  //     assert.equal(devhub.callCount, dd);
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  //     assert.equal(scratchOrg.callCount, sc);
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  //     // assert.equal(store.callCount, st);
  //   } finally {
  //     fs.unlinkSync(tFile);
  //   }
  // }
  // it('Should setup just devhub', async () => {
  //   await setupSetup('one-devhub', {}, 1);
  // });
  // it('Should setup 1 scratchorg', async () => {
  //   await setupSetup('one-scratchorg', { scratchOrgs: [{ scratchOrgAdminUsername: 'test' }] }, 1, 1, 1);
  // });
  // it('Should setup 2 scratchorg', async () => {
  //   await setupSetup(
  //     'two-scratchorg',
  //     { scratchOrgs: [{ scratchOrgAdminUsername: 'test' }, { scratchOrgAdminUsername: 'test2' }] },
  //     1,
  //     2,
  //     2
  //   );
  // });
  // it('Should setup 2 stores', async () => {
  //   await setupSetup(
  //     'two-stores',
  //     {
  //       scratchOrgs: [{ scratchOrgAdminUsername: 'test', stores: [{ storeName: 'testA' }, { storeName: 'testB' }] }],
  //     },
  //     1,
  //     1,
  //     2
  //   );
  // });
});
