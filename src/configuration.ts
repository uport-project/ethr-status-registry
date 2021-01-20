import { JsonRpcProvider } from '@ethersproject/providers'

function configureNetworksWithInfura(projectId: string) {
  const networks = [
    { name: 'mainnet', rpcUrl: `https://mainnet.infura.io/v3/${projectId}` },
    { name: '0x1', rpcUrl: `https://mainnet.infura.io/v3/${projectId}` },
    { name: 'ropsten', rpcUrl: `https://ropsten.infura.io/v3/${projectId}` },
    { name: '0x3', rpcUrl: `https://ropsten.infura.io/v3/${projectId}` },
    { name: 'rinkeby', rpcUrl: `https://rinkeby.infura.io/v3/${projectId}` },
    { name: '0x4', rpcUrl: `https://rinkeby.infura.io/v3/${projectId}` },
    { name: 'goerli', rpcUrl: `https://goerli.infura.io/v3/${projectId}` },
    { name: '0x5', rpcUrl: `https://goerli.infura.io/v3/${projectId}` },
    { name: 'kovan', rpcUrl: `https://kovan.infura.io/v3/${projectId}` },
    { name: '0x2a', rpcUrl: `https://kovan.infura.io/v3/${projectId}` }
  ]
  return configureNetworks(networks)
}

interface ProviderConfiguration {
  provider?: any
  web3?: any
  rpcUrl?: string
  name?: string
  [index: string]: any
}

function configureProvider(conf: ProviderConfiguration = {}) {
  if (conf.provider) {
    return conf.provider
  } else if (conf.web3) {
    return conf.web3.currentProvider
  } else {
    return new JsonRpcProvider(conf.rpcUrl || 'http://127.0.0.1:8545/')
  }
}

function configureNetwork(conf: ProviderConfiguration = {}) {
  return configureProvider(conf)
}

export interface NetworkConfiguration {
  [index: string]: any
}

function configureNetworks(networksConf: ProviderConfiguration[] = []) {
  const networks: NetworkConfiguration = {}
  for (const net of networksConf) {
    networks[net.name || ''] = configureNetwork(net)
  }
  return networks
}

export interface MultiProviderConfiguration extends ProviderConfiguration {
  networks?: ProviderConfiguration[]
}

export interface InfuraConfiguration {
  infuraProjectId: string
}

export function configureResolverWithNetworks(
  conf: InfuraConfiguration | MultiProviderConfiguration
): NetworkConfiguration {
  let networks: NetworkConfiguration = {}
  if (typeof conf.infuraProjectId === 'string') {
    networks = configureNetworksWithInfura(conf.infuraProjectId)
  } else {
    networks = {
      mainnet: configureNetwork(conf),
      ...configureNetworks((conf as MultiProviderConfiguration).networks)
    }
  }
  return networks
}
