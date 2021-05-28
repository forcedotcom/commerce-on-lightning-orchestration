/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { strict as assert } from 'assert';
import { addAllowedArgs } from '../../../../src/lib/utils/args/flagsUtils';
import { DevhubAuth } from '../../../../src/commands/commerce/devhub/auth';

describe('flagsUtils add allowed args', () => {
  it('should add only args that the sfdxcommand Auth allows', async () => {
    const res = addAllowedArgs(['-c', 'hi', '-b', 'bye'], DevhubAuth);
    // -c is allowed but -b isn't so i don't expect -b to exist in assert
    assert.deepEqual(res, ['-c', 'hi']);
  });
});
