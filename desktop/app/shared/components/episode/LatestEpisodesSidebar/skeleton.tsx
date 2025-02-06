import { FC } from 'react';
import { Skeleton } from '@nextui-org/react';

interface EpisodeSkeletonProps {
  color: string;
}

const EpisodeSkeleton: FC<EpisodeSkeletonProps> = ({ color }) => {
  return (
    <div className="inline-block" style={{ width: 'min-content' }}>
      <div className="flex flex-col w-[227px] max-w-[227px]">
        <div className="relative">
          <Skeleton
            className="rounded-lg"
            style={{
              backgroundColor: `${color}30`
            }}
          >
            <div className="w-[227px] h-32 rounded-lg bg-default-300"></div>
          </Skeleton>
        </div>
        <div className="flex flex-row justify-between mt-1 overflow-hidden">
          <Skeleton
            className="flex-grow rounded-lg"
            style={{
              backgroundColor: `${color}30`
            }}
          >
            <div className="h-6 w-36 bg-default-200"></div>
          </Skeleton>
          <Skeleton
            className="ml-2 flex-shrink-0 rounded-lg"
            style={{
              backgroundColor: `${color}30`
            }}
          >
            <div className="h-6 w-20 bg-default-100"></div>
          </Skeleton>
        </div>
      </div>
    </div>
  );
};

export default EpisodeSkeleton;
