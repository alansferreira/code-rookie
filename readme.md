# easy-peasy project 

Extensible templating processor for boilerplate projects and components

## Motivation

After several fractions of project templates that don't offer extensibility beyond an "inspectable" environment, like a debugging environment, I decided to create a processor with these features.

## Features expected

- [x] Inspectable environment ( Integration of @easy-peasy/core + vscode + nodejs)
- [x] Extends processors while fetch template files (preProcess, beforeAll, beforeEach, afterEach, afterAll, prosProcess)
- [x] Reduce memory usage while processing files (yield)
- [x] Integrate with git repositories, thank's very mutch [nodegit maintainers](https://github.com/nodegit)
- [ ] Web interface integrated with Database to catalog many things
- [ ] CLI interface to use anywere


## Usage

See `spec.ts` and `.vscode/launch.json` files to run/debug and examples of use.

