# Contributing

Thank you for your interest in Peaks.js!

We love hearing feedback from people who use our software, so if you build something interesting using this library, please let us know.

Contributions are welcomed and encouraged. If you're thinking of fixing a bug or writing a new feature, please first read the following guidelines.

## Asking questions

* We welcome questions on how to use Peaks.js. Please check the [Frequently Asked Questions](doc/faq.md) in case your question is already answered there.

## Making changes

* Before creating a pull request, we prefer that you first discuss the change you want to make, either by raising an issue, or contacting us directly, e.g., [by email](mailto:chris@chrisneedham.com).

* Please check our [development plan](https://github.com/bbc/peaks.js/projects/1), which shows the current and planned changes.

* If we agree with your feature proposal, we'll work with you to develop and integrate the feature. But please bear with us, as we may not always be able to respond immediately.

* Pull requests should focus on making a single change. Avoid combining multiple unrelated changes in a single pull request. This allows for easier review and increases the chance that your pull request will be accepted as is.

* Please avoid making commits directly to your copy of the `master` branch. This branch is reserved for aggregating changes from other people, and for mainline development from the core contributors. If you commit to `master`, it's likely that your local fork will diverge from the [upstream repository](https://github.com/bbc/peaks.js).

* Before working on a change, please ensure your local fork is up to date with the code in the upstream repository, and create a [feature branch](https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow) for your changes.

* Please don't change the `version` field in [package.json](https://github.com/bbc/peaks.js/blob/master/package.json) or update [CHANGELOG.md](https://github.com/bbc/peaks.js/blob/master/CHANGELOG.md). We'll do that when [preparing a new release](#preparing-a-new-release).

* Please follow the existing coding conventions, and ensure that there are no linting errors, using `npm run lint`. The eslint config doesn't specify all our coding conventions, so please try to be consistent.

* For commit messages, please follow [these guidelines](https://chris.beams.io/posts/git-commit/), although we're not fussy about use of imperative mood vs past tense. In particular, please don't use [Conventional Commits](https://www.conventionalcommits.org/) style. We may choose to edit your commit messages for consistency when merging.

* Please add test cases for your feature, and ensure all tests are passing, using `npm run test`.

* When merging a feature branch, the maintainers may choose to squash your commits, so that the feature is merged as a single logical change.

### Preparing a new release

When it's time to publish a new release version, e.g,. to npm, create a single commit on `master` with the following changes only:

* Increment the `version` field in [package.json](https://github.com/bbc/peaks.js/blob/master/package.json).

* Describe the new features in this release in [CHANGELOG.md](https://github.com/bbc/peaks.js/blob/master/CHANGELOG.md).

* Tag this commit using the form `vX.Y.Z` and push the commit using `git push origin master --tags`.

* In GitHub, [create a Release](https://github.com/bbc/peaks.js/releases/new) from this tag, with the tag name as Release title, i.e., vX.Y.Z.

* If this is a beta release, the tag and release names should have the form `vX.Y.Z-beta.N`.

* Creating a Release triggers a [GitHub Action workflow](https://github.com/bbc/peaks.js/blob/master/.github/workflows/npm-publish.yml) that publishes to NPM. This will publish either a `latest` or `beta` release, based on the tag name.
