module.exports = {
  ...require('@joystream/prettier-config'),
  overrides: [
    {
      files: '*.sol',
      options: {
        singleQuote: false,
      },
    },
  ],
}
