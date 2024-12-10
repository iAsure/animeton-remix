import { FC } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Skeleton
} from '@nextui-org/react';

const EpisodeCardSkeleton: FC = () => {
  return (
    <div className="max-w-[400px] px-4">
      <Card className="flex flex-col relative overflow-visible">
        <CardHeader className="flex flex-col truncate items-start justify-start">
          <Skeleton className="w-3/4 rounded-lg">
            <div className="h-6 rounded-lg bg-default-200"></div>
          </Skeleton>
          <Skeleton className="w-1/2 rounded-lg mt-2">
            <div className="h-4 rounded-lg bg-default-100"></div>
          </Skeleton>
        </CardHeader>
        <CardBody
          className="w-full h-full p-0 relative transition duration-300 ease-in-out hover:scale-105 cursor-pointer"
        >
          <Skeleton className="w-full h-full">
            <div className="aspect-[16/9] w-[337px] min-w-[250px] max-w-[337px] rounded-t-lg bg-default-300"></div>
          </Skeleton>
          <Skeleton className="flex flex-row gap-2 px-1 py-0.5 rounded-md absolute top-2 right-2">
            <div className="h-6 w-16 rounded-md bg-default-200"></div>
          </Skeleton>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 ease-in-out hover:opacity-70">
            <Skeleton className="rounded-full">
              <div className="h-16 w-16 rounded-full bg-default-200"></div>
            </Skeleton>
          </div>
        </CardBody>
        <CardFooter>
          <div className="flex justify-between items-center w-full mt-2">
            <Skeleton className="flex items-center rounded-lg">
              <div className="h-4 w-24 rounded-lg bg-default-200"></div>
            </Skeleton>
            <Skeleton className="flex items-center rounded-lg">
              <div className="h-4 w-24 rounded-lg bg-default-200"></div>
            </Skeleton>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EpisodeCardSkeleton;
