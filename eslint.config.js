import { readFile } from 'node:fs/promises'
import lincy from '@lincy/eslint-config'

const config = lincy(
    {
        formatters: {
            css: false,
            graphql: true,
            html: true,
            markdown: true,
            toml: false,
        },
        overrides: {
            stylistic: {
                'style/jsx-max-props-per-line': ['error', { maximum: 4 }],
            },
        },
    },
    {
        ignores: [
            '**/assets',
            '**/static',
            '**/lists.json',
        ],
    },
)

export default config
