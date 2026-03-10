export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'refactor', 'chore', 'perf', 'test', 'style', 'ci', 'revert'],
    ],
    'scope-enum': [0],
    'subject-max-length': [2, 'always', 72],
  },
}
