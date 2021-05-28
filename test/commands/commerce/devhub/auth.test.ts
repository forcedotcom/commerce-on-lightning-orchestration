/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { strict as assert } from 'assert';
import { StubbedType, stubInterface } from '@salesforce/ts-sinon';
import { fs, SfdxError } from '@salesforce/core';
import { $$ } from '@salesforce/command/lib/test';
import { UX } from '@salesforce/command';
import { IConfig } from '@oclif/config';
import { stub } from 'sinon';
import sinon from 'sinon';
import { Requires } from '../../../../src/lib/utils/requires';
import { DevhubAuth } from '../../../../src/commands/commerce/devhub/auth';
import * as shellExports from '../../../../src/lib/utils/shell';
import * as fsUtilsExports from '../../../../src/lib/utils/fsUtils';
import { Result, Org } from '../../../../src/lib/utils/jsonUtils';

describe('commerce:devhub:auth', () => {
  const config = stubInterface<IConfig>($$.SANDBOX, {});
  let uxStub: StubbedType<UX>;

  async function createNewAuthCommand(
    flags: Record<string, string | boolean> = {},
    promptAnswer = 'NO'
  ): Promise<DevhubAuth> {
    uxStub = stubInterface<UX>($$.SANDBOX, {
      prompt: () => promptAnswer,
    });

    const login = new DevhubAuth([], config);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore because protected member
    login.ux = uxStub;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore because protected member
    login.flags = Object.assign({}, { configuration: 'devhub-configuration.json' }, flags);
    return login;
  }

  afterEach(() => sinon.restore());

  it('Should not auth if already authed', async () => {
    const d = stub(Requires, 'default').returns(new Requires());
    const orgRes = new Result<Org>('');
    orgRes.result = new Org('');
    orgRes.result.connectedStatus = 'Connected';
    const c = stub(shellExports, 'shellJsonSfdx').returns(orgRes);
    const e = stub(fsUtilsExports, 'mkdirSync').returns('./');
    const f = stub(fs, 'writeFileSync');
    await (await createNewAuthCommand()).run();
    assert.equal(c.callCount, 1);
    [c, d, e, f].forEach((r) => r.restore());
  });

  it('Should auth if not authed', async () => {
    const d = stub(Requires, 'default').returns(new Requires());
    const orgRes = new Result<Org>('');
    orgRes.result = new Org('');
    orgRes.result.connectedStatus = 'Connected';
    const c = stub(shellExports, 'shellJsonSfdx')
      .onFirstCall()
      .throws(new SfdxError(''))
      .onSecondCall()
      .returns(orgRes)
      .onThirdCall()
      .returns(orgRes);
    const c1 = stub(fs, 'readJsonSync').returns({});
    const c2 = stub(fs, 'writeJson').resolves();
    const e = stub(fsUtilsExports, 'mkdirSync').returns('./');
    const f = stub(fs, 'writeFileSync');
    await (await createNewAuthCommand()).run();
    assert.equal(c.callCount, 3);
    [c, c1, c2, d, e, f].forEach((k) => k.restore());
  });
});
