/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { fs } from '@salesforce/core';
import { allFlags } from '../../flags/commerce/all.flags';
import { DevHubConfig } from '../jsonUtils';
import { convertKabobToCamel } from '../stringUtils';

function contains(v: string, a): boolean {
  for (const i of a) if (i === v) return true;
  return false;
}

/**
 * Pass in a flag and this will check the argv and config json file to see if it was passed or if it's just a default value
 *
 * @param flag
 * @param argv
 * @param config
 * @param flags
 */
export function isFlagPassed(
  flag: string,
  argv: string[],
  n = 0,
  m = 0,
  config = allFlags.configuration.default.toString(),
  flags = allFlags
): boolean {
  if (getAllPassedFlags(argv, flags)[flag]) return true;
  // now i know it wasn't a passed in flag but was it given in the json config file?
  // much harder to tell since the file has different layers ie devhub (global), scrt and store
  // so i need to read the original config file then go to the nm location
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const conf: DevHubConfig = Object.assign(DevHubConfig, JSON.parse(fs.readFileSync(config).toString()));
  if (conf[convertKabobToCamel(flag.replace(/^--/g, ''))]) return true;
  if (conf.scratchOrgs[n][convertKabobToCamel(flag.replace(/^--/g, ''))]) return true;
  if (conf.scratchOrgs[n].stores[m][convertKabobToCamel(flag.replace(/^--/g, ''))]) return true;
  return false;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function getAllPassedFlags(argv: string[], flags = allFlags): {} {
  // put all flags in both long and short format ie: -c and --configuration
  const flagsArr = {};
  Object.keys(flags).forEach((f) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    flagsArr['--' + f] = flags[f];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-plus-operands,@typescript-eslint/no-unsafe-assignment
    if (flags[f].char) flagsArr['-' + flags[f].char] = flags[f];
  });
  // this should have all flags that were passed in
  const passedFlags = {};
  argv
    .filter((v) => v.startsWith('-'))
    .map((v) => (v.length === '-v'.length ? v.substr('-v'.length) : v))
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-assignment
    .forEach((v) => (passedFlags[v] = flagsArr[v]));
  return passedFlags;
}
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function getFlagArgs(flags) {
  const flagsArr = [];
  Object.keys(flags).forEach((f) => {
    flagsArr.push('--' + f);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-plus-operands
    if (flags[f].char) flagsArr.push('-' + flags[f].char);
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return flagsArr;
}
/**
 * This function will read in a list of flags from sfdxCommand parameter
 * then filter through argv parameter and keep only the ones in the former
 *
 * @param argv
 * @param sfdxCommand
 * @return
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function addAllowedArgs(argv: string[], sfdxCommand): string[] {
  const args = [];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const flags = sfdxCommand.flags;
  const flagsArr = getFlagArgs(flags);
  for (let i = 0; i < argv.length; i++) {
    let arg = argv[i];
    let value = argv[i + 1] && !argv[i + 1].startsWith('-') ? argv[++i] : undefined;
    if (!arg.startsWith('--') && arg.length > '-v'.length) {
      value = arg.substr('-v'.length);
      arg = arg.substr(0, '-v'.length);
    }
    if (contains(arg, flagsArr)) {
      args.push(arg);
      if (value) args.push(value);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return args;
}

/**
 * Adds value to flag in argv list or adds flag and value to list if not present
 *
 * @param flag
 * @param value
 * @param argv
 */
export function modifyArgFlag(flag: string[], value: string, argv: string[]): void {
  let isModified = false;
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('-')) continue;
    for (const j of flag)
      if (j === argv[i]) {
        argv[i + 1] = value + '';
        isModified = true;
      }
  }
  if (!isModified) {
    argv.push(flag[0]);
    argv.push(value);
  }
}

/**
 *
 * @param desiredFlags flags you want
 * @param flags the flags to pick from
 * @param isInclude if true then pick from desiredFlags, if false then discarded the desiredFlags
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function filterFlags(desiredFlags: string[], flags: {}, isInclude = true): {} {
  return Object.keys(flags)
    .filter((key) => (isInclude ? desiredFlags.includes(key) : !desiredFlags.includes(key)))
    .reduce((obj, key) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      obj[key] = flags[key];
      return obj;
    }, {});
}

export function addFlagBeforeAll(flag: string, cmds: string[]): string[] {
  if (!cmds) return cmds;
  const v: string[] = [];
  cmds.forEach((a) => {
    v.push(flag);
    v.push(a);
  });
  return v;
}

export const removeFlagBeforeAll = (flag: string, cmds: string[]): string[] => {
  if (!cmds) return cmds;
  return cmds.filter((c) => c !== flag);
};
