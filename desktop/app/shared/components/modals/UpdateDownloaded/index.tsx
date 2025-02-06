import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Divider,
} from '@nextui-org/react';
import { Icon } from '@iconify/react';
import useGithubVersion from '@hooks/useGithubVersion';

const UpdateDownloadedModal = ({ onClose }) => {
  const { data: version, isLoading, error } = useGithubVersion('latest');

  return (
    <Modal isOpen={true} onClose={onClose} className="dark">
      <ModalContent>
        <ModalHeader className="font-bold text-2xl text-white flex items-center gap-3">
          <Icon
            icon="gravity-ui:cloud-check"
            width="32"
            height="32"
            className="text-white mt-1"
          />
          {isLoading
            ? 'Preparando actualización...'
            : `AniTorrent v${version?.version}`}
        </ModalHeader>
        <Divider className="bg-zinc-700" />
        <ModalBody>
          <div className="space-y-4 text-white">
            {error ? (
              <p className="text-red-500">
                No se pudo cargar la información de la actualización.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">
                    ¡Nueva actualización disponible!
                  </h3>
                  <p className="text-zinc-300">
                    La actualización se ha descargado y está lista para
                    instalarse.
                  </p>
                </div>

                {!isLoading && version?.changelog && (
                  <div className="mt-4">
                    <h4 className="text-md font-medium mb-2 text-zinc-300">
                      Novedades:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      {version.changelog.map((change, index) => (
                        <li key={index} className="text-zinc-400 text-sm">
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </ModalBody>
        <Divider className="bg-zinc-700" />
        <ModalFooter className="flex gap-3">
          <Button
            className="bg-zinc-700 text-white font-medium hover:opacity-90"
            onClick={onClose}
          >
            Más tarde
          </Button>
          <Button
            className="bg-white text-black font-medium hover:opacity-90"
            startContent={
              <Icon
                icon="material-symbols:restart-alt"
                width="20"
                height="20"
              />
            }
            onClick={() => window.api.updater.quitAndInstall()}
          >
            Reiniciar ahora
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UpdateDownloadedModal;
