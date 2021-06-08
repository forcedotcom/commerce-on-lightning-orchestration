/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Hook } from '@oclif/config';
import { fs } from '@salesforce/core';
import { B_DIR, BASE_DIR } from '../../lib/utils/constants/properties';
import { copyFolderRecursiveSync, mkdirSync, remove } from '../../lib/utils/fsUtils';

// eslint-disable-next-line @typescript-eslint/require-await
export const hook: Hook<'init'> = async () => {
  // TODO takes a second to run, might be overkill to run everytime maybe put a last synced metadata or something to know when to copy files over
  mkdirSync(BASE_DIR);
  const dirs = ['config'];
  dirs.forEach((d) => {
    remove(BASE_DIR + '/' + d);
    copyFolderRecursiveSync(B_DIR + '/' + d, BASE_DIR);
  });
  const files = ['devhub-configuration.json']; // fs.linkSync
  files
    .filter((f) => !fs.existsSync(BASE_DIR + '/' + f))
    .forEach((f) => fs.copyFileSync(B_DIR + '/' + f, BASE_DIR + '/' + f));
};
