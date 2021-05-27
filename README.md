# 1commerce Developer commerce

[![Version](https://img.shields.io/npm/v/1commerce.svg)](https://npmjs.org/package/1commerce)
[![CircleCI](https://circleci.com/gh/1commerce/1commerce/tree/master.svg?style=shield)](https://circleci.com/gh/1commerce/1commerce/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/1commerce/1commerce?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/1commerce/branch/master)
[![Codecov](https://codecov.io/gh/1commerce/1commerce/branch/master/graph/badge.svg)](https://codecov.io/gh/1commerce/1commerce)
[![Greenkeeper](https://badges.greenkeeper.io/1commerce/1commerce.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/1commerce/1commerce/badge.svg)](https://snyk.io/test/github/1commerce/1commerce)
[![Downloads/week](https://img.shields.io/npm/dw/1commerce.svg)](https://npmjs.org/package/1commerce)
[![License](https://img.shields.io/npm/l/1commerce.svg)](https://github.com/1commerce/1commerce/blob/master/package.json)
==============

<strong>Please use this Quip Doc for latest information:</strong>

[[WIP] commerce Store Setup using SFDX](https://salesforce.quip.com/xMU3ATjR1QQa)

==============

-   [Install](#install)
-   [Post Install](#now-that-you-have-the-commerce-plugin-installed-please-see)
-   [Commands](#commands)
-   [Debugging your plugin](#debugging-your-plugin)
<!-- install -->

## Install

<strong>Intended for most users</strong>

First install the [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli).
Next install the commerce plugin

```
echo y | sfdx plugins:install ssh://git@git.soma.salesforce.com:communities/1commerce.git
```

Now, you can run the commerce commands.

```
sfdx b2c:setup
```

See below for the full list of commands.

### To run from local git repo:

<strong>Intended for plugin developers or people trying out a workaround and don't want to override there b2c sfdx plugin.</strong>

```
$ yarn install
$ bin/run b2c
```

### When you’re ready to test-drive your plug-in from local git repo, link your git repo to Salesforce CLI.

<strong>Intended for plugin developers or people trying out a workaround and want this to be their default for sfdx b2c commands</strong>
from inside the root of the git repo

```
sfdx plugins:link
```

## Now that you have the b2c plugin installed please see:

-   [Usage Wiki](https://git.soma.salesforce.com/communities/1commerce/wiki/Usage)
-   [Quip Doc: [WIP] B2C Store Setup using SFDX](https://salesforce.quip.com/xMU3ATjR1QQa)

<!-- installstop -->

## Commands

<!-- commands -->

-   [`sfdx b2c:devhub:auth [-c <filepath>] [-F <filepath>] [-J] [-i <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-b2cdevhubauth--c-filepath--f-filepath--j--i-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
-   [`sfdx b2c:examples:convert [-f <filepath>] [-o <string>] [-v <string>] [-c <filepath>] [-s <string>] [-m <integer>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-b2cexamplesconvert--f-filepath--o-string--v-string--c-filepath--s-string--m-integer---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
-   [`sfdx b2c:open:devhubconfig [-e <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-b2copendevhubconfig--e-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
-   [`sfdx b2c:payments:quickstart:setup [-p <string>] [-c <filepath>] [-u <string>] [-n <number>] [-s <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-b2cpaymentsquickstartsetup--p-string--c-filepath--u-string--n-number--s-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
-   [`sfdx b2c:products:import [-p <string>] [-c <filepath>] [-u <string>] [-n <number>] [-s <string>] [-m <integer>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-b2cproductsimport--p-string--c-filepath--u-string--n-number--s-string--m-integer---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
-   [`sfdx b2c:scratchorg:create [-c <filepath>] [-a <string>] [-v <string>] [-u <string>] [-n <number>] [-p] [-g <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-b2cscratchorgcreate--c-filepath--a-string--v-string--u-string--n-number--p--g-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
-   [`sfdx b2c:setup [-c <filepath>] [-u <string>] [-s <string>] [-n <integer>] [-m <integer>] [-r] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-b2csetup--c-filepath--u-string--s-string--n-integer--m-integer--r---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
-   [`sfdx b2c:store:create [-c <filepath>] [-u <string>] [-n <number>] [-t <string>] [-b <string>] [-s <string>] [-m <integer>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-b2cstorecreate--c-filepath--u-string--n-number--t-string--b-string--s-string--m-integer---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
-   [`sfdx b2c:store:quickstart:create [-c <filepath>] [-u <string>] [-n <number>] [-t <string>] [-s <string>] [-m <integer>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-b2cstorequickstartcreate--c-filepath--u-string--n-number--t-string--s-string--m-integer---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
-   [`sfdx b2c:store:quickstart:setup [-c <filepath>] [-u <string>] [-n <number>] [-s <string>] [-m <integer>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-b2cstorequickstartsetup--c-filepath--u-string--n-number--s-string--m-integer---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
-   [`sfdx b2c:store:view [-c <filepath>] [-u <string>] [-n <number>] [-s <string>] [-m <integer>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-b2cstoreview--c-filepath--u-string--n-number--s-string--m-integer---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
-   [`sfdx b2c:store:view:all [-c <filepath>] [-u <string>] [-n <number>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-b2cstoreviewall--c-filepath--u-string--n-number---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
-   [`sfdx b2c:store:view:info [-c <filepath>] [-u <string>] [-s <string>] [-n <number>] [-p] [-g <string>] [-m <integer>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-b2cstoreviewinfo--c-filepath--u-string--s-string--n-number--p--g-string--m-integer---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx b2c:devhub:auth [-c <filepath>] [-F <filepath>] [-J] [-i <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Authorize a devhub

```
USAGE
  $ sfdx b2c:devhub:auth [-c <filepath>] [-F <filepath>] [-J] [-i <string>] [--json] [--loglevel
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -F, --server-cert=server-cert                                                     [default:
                                                                                    ~/.b2c/.certs/server.crt
                                                                                    ] Server Cert file

  -J, --use-jwt                                                                     Use JWT to auth

  -c, --configuration=configuration                                                 [default:
                                                                                    ~/.b2c/devhub-configurat
                                                                                    ion.json] Pass in config to override
                                                                                    default

  -i, --client-id=client-id                                                         Client Id for auth:web:login

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  sfdx b2c:devhub:auth --configuration devhub-configuration.json
```

## `sfdx b2c:examples:convert [-f <filepath>] [-o <string>] [-v <string>] [-c <filepath>] [-s <string>] [-m <integer>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Convert Examples to SFDX

```
USAGE
  $ sfdx b2c:examples:convert [-f <filepath>] [-o <string>] [-v <string>] [-c <filepath>] [-s <string>] [-m <integer>]
  [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -c, --configuration=configuration                                                 [default:
                                                                                    ~/.b2c/devhub-configurat
                                                                                    ion.json] Pass in config to override
                                                                                    default

  -f, --config-file=config-file                                                     [default:
                                                                                    ~/.b2c/examples/convert-
                                                                                    these.txt] config file

  -m, --store-number=store-number                                                   Index number for the store to be
                                                                                    created

  -o, --output-dir=output-dir                                                       [default:
                                                                                    ~/.b2c/force-app]
                                                                                    Directory to output the conversion

  -s, --store-name=store-name                                                       [default: 1commerce] Store's Name to
                                                                                    be created

  -v, --convert=convert                                                             Files to convert

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  sfdx b2c:examples:convert --config-file ~/.b2c/examples/convert-these.txt
```

## `sfdx b2c:open:devhubconfig [-e <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Open devhub-configuration.json file

```
USAGE
  $ sfdx b2c:open:devhubconfig [-e <string>] [--json] [--loglevel
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -e, --editor=editor                                                               [default: vi] Editor to open file
                                                                                    with

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  sfdx b2c:open:devhubconfig -e atom
```

## `sfdx b2c:payments:quickstart:setup [-p <string>] [-c <filepath>] [-u <string>] [-n <number>] [-s <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

This script will set up all the required parts for using a new Payment Gateway

```
USAGE
  $ sfdx b2c:payments:quickstart:setup [-p <string>] [-c <filepath>] [-u <string>] [-n <number>] [-s <string>] [--json]
  [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -c, --configuration=configuration                                                 [default:
                                                                                    ~/.b2c/devhub-configurat
                                                                                    ion.json] Pass in config to override
                                                                                    default

  -n, --scratch-org-number=scratch-org-number                                       Which store to create from config
                                                                                    file scratchOrgs list -1 for all
                                                                                    stores

  -p, --payment-adapter=payment-adapter                                             [default: Salesforce] Payment
                                                                                    Adapter

  -s, --store-name=store-name                                                       [default: 1commerce] Store's Name to
                                                                                    be created

  -u, --scratch-org-admin-username=scratch-org-admin-username                       [default: demo@1commerce.com]
                                                                                    username of the admin to associate
                                                                                    with the scratch org.

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  sfdx b2c:payments:quickstart:setup --configuration devhub-configuration.json
```

## `sfdx b2c:products:import [-p <string>] [-c <filepath>] [-u <string>] [-n <number>] [-s <string>] [-m <integer>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Amend files needed to fill out Product data and import Products and related data to make store functional

```
USAGE
  $ sfdx b2c:products:import [-p <string>] [-c <filepath>] [-u <string>] [-n <number>] [-s <string>] [-m <integer>]
  [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -c, --configuration=configuration
      [default: ~/.b2c/devhub-configuration.json] Pass in config to override default

  -m, --store-number=store-number
      Index number for the store to be created

  -n, --scratch-org-number=scratch-org-number
      Which store to create from config file scratchOrgs list -1 for all stores

  -p, --products-file-csv=products-file-csv
      [default: ~/.b2c/examples/csv/Alpine-small.csv] The csv file containing products to import.  Pass in
      empty value to do product-less import

  -s, --store-name=store-name
      [default: 1commerce] Store's Name to be created

  -u, --scratch-org-admin-username=scratch-org-admin-username
      [default: demo@1commerce.com] username of the admin to associate with the scratch org.

  --json
      format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)
      [default: warn] logging level for this command invocation

EXAMPLE
  sfdx b2c:products:import --configuration devhub-configuration.json
```

## `sfdx b2c:scratchorg:create [-c <filepath>] [-a <string>] [-v <string>] [-u <string>] [-n <number>] [-p] [-g <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Create a scratch org

```
USAGE
  $ sfdx b2c:scratchorg:create [-c <filepath>] [-a <string>] [-v <string>] [-u <string>] [-n <number>] [-p] [-g
  <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -a, --hub-org-admin-username=hub-org-admin-username                               [default: ceo@mydevhub.com] username
                                                                                    of the hub org admin

  -c, --configuration=configuration                                                 [default:
                                                                                    ~/.b2c/devhub-configurat
                                                                                    ion.json] Pass in config to override
                                                                                    default

  -g, --scratch-org-alias=scratch-org-alias                                         [default: devhub] Alias name for
                                                                                    this scratch org

  -n, --scratch-org-number=scratch-org-number                                       Which store to create from config
                                                                                    file scratchOrgs list -1 for all
                                                                                    stores

  -p, --is-b2c-lite-access-perm-needed                                              Should the script run sfdx
                                                                                    force:org:open and wait for you to
                                                                                    save B2CLiteAccessPerm?

  -u, --scratch-org-admin-username=scratch-org-admin-username                       [default: demo@1commerce.com]
                                                                                    username of the admin to associate
                                                                                    with the scratch org.

  -v, --api-version=api-version                                                     [default: 52.0] Version of current
                                                                                    Salesforce

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  sfdx b2c:scratchorg:create --configuration devhub-configuration.json
```

## `sfdx b2c:setup [-c <filepath>] [-u <string>] [-s <string>] [-n <integer>] [-m <integer>] [-r] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Setup a devhub and scratch org from start to finish with one command

```
USAGE
  $ sfdx b2c:setup [-c <filepath>] [-u <string>] [-s <string>] [-n <integer>] [-m <integer>] [-r] [--json] [--loglevel
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -c, --configuration=configuration                                                 [default:
                                                                                    ~/.b2c/devhub-configurat
                                                                                    ion.json] Pass in config to override
                                                                                    default

  -m, --store-number=store-number                                                   [default: -1] Index number for the
                                                                                    store to be created

  -n, --scratch-org-number=scratch-org-number                                       [default: -1] Which store to create
                                                                                    from config file scratchOrgs list -1
                                                                                    for all stores

  -r, --reset-all                                                                   Reset org clearing all devhub and
                                                                                    scratch orgs and sdb

  -s, --scratch-org-store-name=scratch-org-store-name                               [default: 1commerce] Name of scratch
                                                                                    org store

  -u, --scratch-org-admin-username=scratch-org-admin-username                       [default: demo@1commerce.com]
                                                                                    username of the admin to associate
                                                                                    with the scratch org.

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLES
  sfdx b2c:setup --configuration devhub-configuration.json
  sfdx b2c:setup -r -y
```

## `sfdx b2c:store:create [-c <filepath>] [-u <string>] [-n <number>] [-t <string>] [-b <string>] [-s <string>] [-m <integer>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Create a store

```
USAGE
  $ sfdx b2c:store:create [-c <filepath>] [-u <string>] [-n <number>] [-t <string>] [-b <string>] [-s <string>] [-m
  <integer>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -b, --scratch-org-buyer-username=scratch-org-buyer-username                       [default: buyer@1commerce.com]
                                                                                    buyer's username

  -c, --configuration=configuration                                                 [default:
                                                                                    ~/.b2c/devhub-configurat
                                                                                    ion.json] Pass in config to override
                                                                                    default

  -m, --store-number=store-number                                                   Index number for the store to be
                                                                                    created

  -n, --scratch-org-number=scratch-org-number                                       Which store to create from config
                                                                                    file scratchOrgs list -1 for all
                                                                                    stores

  -s, --store-name=store-name                                                       [default: 1commerce] Store's Name to
                                                                                    be created

  -t, --template-name=template-name                                                 [default: b2c-lite-storefront]
                                                                                    Template name

  -u, --scratch-org-admin-username=scratch-org-admin-username                       [default: demo@1commerce.com]
                                                                                    username of the admin to associate
                                                                                    with the scratch org.

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  sfdx b2c:store:create --configuration devhub-configuration.json
```

## `sfdx b2c:store:quickstart:create [-c <filepath>] [-u <string>] [-n <number>] [-t <string>] [-s <string>] [-m <integer>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Quickstart various create store

```
USAGE
  $ sfdx b2c:store:quickstart:create [-c <filepath>] [-u <string>] [-n <number>] [-t <string>] [-s <string>] [-m
  <integer>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -c, --configuration=configuration                                                 [default:
                                                                                    ~/.b2c/devhub-configurat
                                                                                    ion.json] Pass in config to override
                                                                                    default

  -m, --store-number=store-number                                                   Index number for the store to be
                                                                                    created

  -n, --scratch-org-number=scratch-org-number                                       Which store to create from config
                                                                                    file scratchOrgs list -1 for all
                                                                                    stores

  -s, --store-name=store-name                                                       [default: 1commerce] Store's Name to
                                                                                    be created

  -t, --template-name=template-name                                                 [default: b2c-lite-storefront]
                                                                                    Template name

  -u, --scratch-org-admin-username=scratch-org-admin-username                       [default: demo@1commerce.com]
                                                                                    username of the admin to associate
                                                                                    with the scratch org.

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  sfdx b2c:store:quickstart:create --configuration devhub-configuration.json
```

## `sfdx b2c:store:quickstart:setup [-c <filepath>] [-u <string>] [-n <number>] [-s <string>] [-m <integer>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Quickstart various store setup

```
USAGE
  $ sfdx b2c:store:quickstart:setup [-c <filepath>] [-u <string>] [-n <number>] [-s <string>] [-m <integer>] [--json]
  [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -c, --configuration=configuration                                                 [default:
                                                                                    ~/.b2c/devhub-configurat
                                                                                    ion.json] Pass in config to override
                                                                                    default

  -m, --store-number=store-number                                                   Index number for the store to be
                                                                                    created

  -n, --scratch-org-number=scratch-org-number                                       Which store to create from config
                                                                                    file scratchOrgs list -1 for all
                                                                                    stores

  -s, --store-name=store-name                                                       [default: 1commerce] Store's Name to
                                                                                    be created

  -u, --scratch-org-admin-username=scratch-org-admin-username                       [default: demo@1commerce.com]
                                                                                    username of the admin to associate
                                                                                    with the scratch org.

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  sfdx b2c:store:quickstart:setup --configuration devhub-configuration.json
```

## `sfdx b2c:store:view [-c <filepath>] [-u <string>] [-n <number>] [-s <string>] [-m <integer>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

View Store

```
USAGE
  $ sfdx b2c:store:view [-c <filepath>] [-u <string>] [-n <number>] [-s <string>] [-m <integer>] [--json] [--loglevel
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -c, --configuration=configuration                                                 [default:
                                                                                    ~/.b2c/devhub-configurat
                                                                                    ion.json] Pass in config to override
                                                                                    default

  -m, --store-number=store-number                                                   Index number for the store to be
                                                                                    created

  -n, --scratch-org-number=scratch-org-number                                       Which store to create from config
                                                                                    file scratchOrgs list -1 for all
                                                                                    stores

  -s, --store-name=store-name                                                       [default: 1commerce] Store's Name to
                                                                                    be created

  -u, --scratch-org-admin-username=scratch-org-admin-username                       [default: demo@1commerce.com]
                                                                                    username of the admin to associate
                                                                                    with the scratch org.

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  sfdx b2c:store:view --configuration devhub-configuration.json
```

## `sfdx b2c:store:view:all [-c <filepath>] [-u <string>] [-n <number>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

View all stores

```
USAGE
  $ sfdx b2c:store:view:all [-c <filepath>] [-u <string>] [-n <number>] [--json] [--loglevel
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -c, --configuration=configuration                                                 [default:
                                                                                    ~/.b2c/devhub-configurat
                                                                                    ion.json] Pass in config to override
                                                                                    default

  -n, --scratch-org-number=scratch-org-number                                       Which store to create from config
                                                                                    file scratchOrgs list -1 for all
                                                                                    stores

  -u, --scratch-org-admin-username=scratch-org-admin-username                       [default: demo@1commerce.com]
                                                                                    username of the admin to associate
                                                                                    with the scratch org.

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  sfdx b2c:store:view:all --configuration devhub-configuration.json
```

## `sfdx b2c:store:view:info [-c <filepath>] [-u <string>] [-s <string>] [-n <number>] [-p] [-g <string>] [-m <integer>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Get store view info

```
USAGE
  $ sfdx b2c:store:view:info [-c <filepath>] [-u <string>] [-s <string>] [-n <number>] [-p] [-g <string>] [-m <integer>]
  [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -c, --configuration=configuration                                                 [default:
                                                                                    ~/.b2c/devhub-configurat
                                                                                    ion.json] Pass in config to override
                                                                                    default

  -g, --scratch-org-alias=scratch-org-alias                                         [default: devhub] Alias name for
                                                                                    this scratch org

  -m, --store-number=store-number                                                   Index number for the store to be
                                                                                    created

  -n, --scratch-org-number=scratch-org-number                                       Which store to create from config
                                                                                    file scratchOrgs list -1 for all
                                                                                    stores

  -p, --is-b2c-lite-access-perm-needed                                              Should the script run sfdx
                                                                                    force:org:open and wait for you to
                                                                                    save B2CLiteAccessPerm?

  -s, --scratch-org-store-name=scratch-org-store-name                               [default: 1commerce] Name of scratch
                                                                                    org store

  -u, --scratch-org-admin-username=scratch-org-admin-username                       [default: demo@1commerce.com]
                                                                                    username of the admin to associate
                                                                                    with the scratch org.

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  sfdx b2c:store:view:info --configuration devhub-configuration.json
```

<!-- commandsstop -->
<!-- debugging-your-plugin -->

# Debugging your plugin

We recommend using the Visual Studio Code (VS Code) IDE for your plugin development. Included in the `.vscode` directory of this plugin is a `launch.json` config file, which allows you to attach a debugger to the node process when running your commands.

To debug the `hello:org` command:

1. Start the inspector

If you linked your plugin to the sfdx cli, call your command with the `dev-suspend` switch:

```sh-session
$ sfdx hello:org -u myOrg@example.com --dev-suspend
```

Alternatively, to call your command using the `bin/run` script, set the `NODE_OPTIONS` environment variable to `--inspect-brk` when starting the debugger:

```sh-session
$ NODE_OPTIONS=--inspect-brk bin/run hello:org -u myOrg@example.com
```

2. Set some breakpoints in your command code
3. Click on the Debug icon in the Activity Bar on the side of VS Code to open up the Debug view.
4. In the upper left hand corner of VS Code, verify that the "Attach to Remote" launch configuration has been chosen.
5. Hit the green play button to the left of the "Attach to Remote" launch configuration window. The debugger should now be suspended on the first line of the program.
6. Hit the green play button at the top middle of VS Code (this play button will be to the right of the play button that you clicked in step #5).
   <br><img src=".images/vscodeScreenshot.png" width="480" height="278"><br>
   Congrats, you are debugging!
