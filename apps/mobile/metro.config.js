const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('node:path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [monorepoRoot]

config.resolver.nodeModulesPaths = [
	path.resolve(projectRoot, 'node_modules'),
	path.resolve(monorepoRoot, 'node_modules'),
]

// Hierarchical lookup must stay ON: pnpm's isolated linker keeps each package's
// dependencies under node_modules/.pnpm/<pkg>/node_modules, and Metro only finds
// them by walking up from the importing file.
config.resolver.unstable_enableSymlinks = true

// watchFolders makes Metro crawl the whole monorepo. Everything below is either
// generated output or another app's dependency tree and must never be bundled.
config.resolver.blockList = [
	/\/packages\/db\/.*/,
	/\/apps\/(backend|agent|pdf-service)\/dist\/.*/,
	/\/apps\/frontend\/\.next\/.*/,
	/\/apps\/(backend|frontend|agent|pdf-service)\/node_modules\/.*/,
]

module.exports = withNativeWind(config, { input: './src/global.css' })
