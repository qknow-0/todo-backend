import { Module, Global } from '@nestjs/common';
import IORedis, { Cluster, Redis } from 'ioredis';
import { ConfigService } from '../config/config.service';

const RedisFactory = {
  provide: 'REDIS',
  useFactory: async (config: ConfigService) => {
    let redis: Redis | Cluster;
    const isCluster = config.get('REDIS_CLUSTER');
    if (isCluster === 'false') {
      redis = new IORedis(+config.get('REDIS_PORT'), config.get('REDIS_HOST'));
    } else {
      redis = new IORedis.Cluster(
        [
          {
            port: +config.get('REDIS_PORT'),
            host: config.get('REDIS_HOST'),
          },
        ],
        {
          slotsRefreshTimeout: 3000,
          dnsLookup: (address, callback) => callback(null, address),
          redisOptions: {
            showFriendlyErrorStack: true,
            tls: {
              checkServerIdentity: (/*host, cert*/) => {
                return undefined;
              },
            },
          },
        },
      );
    }
    return redis;
  },
  inject: [ConfigService],
};

@Global()
@Module({
  providers: [RedisFactory],
  exports: ['REDIS'],
})
export class RedisModule {}
