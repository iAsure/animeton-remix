import { Icon } from '@iconify/react';

const Spinner = () => {
    return (
        <div className="absolute inset-0 flex items-center justify-center opacity-100 z-10">
            <Icon
                icon="fluent:spinner-ios-16-filled"
                width="128"
                height="128"
                className="animate-spin"

            />
        </div>
    );
};

export default Spinner;