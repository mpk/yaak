import { useMutation } from '@tanstack/react-query';
import { useDialog } from '../components/DialogContext';
import { ExportDataDialog } from '../components/ExportDataDialog';
import { useActiveWorkspace } from './useActiveWorkspace';
import { useAlert } from './useAlert';
import { useWorkspaces } from './useWorkspaces';
import { useToast } from '../components/ToastContext';

export function useExportData() {
  const workspaces = useWorkspaces();
  const activeWorkspace = useActiveWorkspace();
  const alert = useAlert();
  const dialog = useDialog();
  const toast = useToast();

  return useMutation({
    mutationKey: ['export_data'],
    onError: (err: string) => {
      alert({ id: 'export-failed', title: 'Export Failed', body: err });
    },
    mutationFn: async () => {
      if (activeWorkspace == null || workspaces.length === 0) return;

      dialog.show({
        id: 'export-data',
        title: 'Export App Data',
        size: 'md',
        noPadding: true,
        render: ({ hide }) => (
          <ExportDataDialog
            onHide={hide}
            workspaces={workspaces}
            activeWorkspace={activeWorkspace}
            onSuccess={() => {
              toast.show({
                variant: 'success',
                message: 'Data export successful',
              });
            }}
          />
        ),
      });
    },
  });
}
