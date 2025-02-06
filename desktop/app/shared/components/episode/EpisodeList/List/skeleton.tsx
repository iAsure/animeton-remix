import { Card, CardBody, Skeleton } from '@nextui-org/react';

interface EpisodeCardSkeletonProps {
  color: string;
}

const EpisodeCardSkeleton = ({ color }: EpisodeCardSkeletonProps) => {
  return (
    <Card className="w-full">
      <CardBody
        className="flex flex-row relative gap-4 justify-start p-4 bg-zinc-950 rounded-xl border-2 border-zinc-900"
      >
        <div className="flex flex-row gap-4 items-center">
          <Skeleton
            className="rounded-lg"
            style={{
              backgroundColor: `${color}30`
            }}
          >
            <div className="w-48 h-32 rounded-lg bg-default-300"></div>
          </Skeleton>
          <div className="flex flex-col gap-2">
            <Skeleton
              className="w-64 rounded-lg"
              style={{
                backgroundColor: `${color}30`
              }}
            >
              <div className="h-8 rounded-lg bg-default-200"></div>
            </Skeleton>
            <Skeleton
              className="w-48 rounded-lg"
              style={{
                backgroundColor: `${color}30`
              }}
            >
              <div className="h-6 rounded-lg bg-default-100"></div>
            </Skeleton>
          </div>
        </div>

        <div className="flex items-center absolute right-4 top-0 bottom-0 gap-2">
          <div className="flex flex-col gap-6 justify-between items-end">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="flex flex-row gap-1 items-center">
                <Skeleton
                  className="w-16 rounded-lg"
                  style={{
                    backgroundColor: `${color}30`
                  }}
                >
                  <div className="h-5 rounded-lg bg-default-100"></div>
                </Skeleton>
                <Skeleton
                  className="rounded-full"
                  style={{
                    backgroundColor: `${color}30`
                  }}
                >
                  <div className="w-4 h-4 rounded-full bg-default-200"></div>
                </Skeleton>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default EpisodeCardSkeleton;
