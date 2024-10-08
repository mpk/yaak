import classNames from 'classnames';
import { memo, useCallback, useMemo } from 'react';
import { useActiveEnvironment } from '../hooks/useActiveEnvironment';
import { useEnvironments } from '../hooks/useEnvironments';
import type { ButtonProps } from './core/Button';
import { Button } from './core/Button';
import type { DropdownItem } from './core/Dropdown';
import { Dropdown } from './core/Dropdown';
import { Icon } from './core/Icon';
import { useDialog } from './DialogContext';
import { EnvironmentEditDialog } from './EnvironmentEditDialog';

type Props = {
  className?: string;
} & Pick<ButtonProps, 'forDropdown' | 'leftSlot'>;

export const EnvironmentActionsDropdown = memo(function EnvironmentActionsDropdown({
  className,
  ...buttonProps
}: Props) {
  const environments = useEnvironments();
  const [activeEnvironment, setActiveEnvironmentId] = useActiveEnvironment();
  const dialog = useDialog();

  const showEnvironmentDialog = useCallback(() => {
    dialog.toggle({
      id: 'environment-editor',
      noPadding: true,
      size: 'lg',
      className: 'h-[80vh]',
      render: () => <EnvironmentEditDialog initialEnvironment={activeEnvironment} />,
    });
  }, [dialog, activeEnvironment]);

  const items: DropdownItem[] = useMemo(
    () => [
      ...environments.map(
        (e) => ({
          key: e.id,
          label: e.name,
          leftSlot: e.id === activeEnvironment?.id ? <Icon icon="check" /> : <Icon icon="empty" />,
          onSelect: async () => {
            if (e.id !== activeEnvironment?.id) {
              setActiveEnvironmentId(e.id);
            } else {
              setActiveEnvironmentId(null);
            }
          },
        }),
        [activeEnvironment?.id],
      ),
      ...((environments.length > 0
        ? [{ type: 'separator', label: 'Environments' }]
        : []) as DropdownItem[]),
      {
        key: 'edit',
        label: 'Manage Environments',
        hotKeyAction: 'environmentEditor.toggle',
        leftSlot: <Icon icon="box" />,
        onSelect: showEnvironmentDialog,
      },
    ],
    [activeEnvironment?.id, environments, setActiveEnvironmentId, showEnvironmentDialog],
  );

  return (
    <Dropdown items={items}>
      <Button
        size="sm"
        className={classNames(
          className,
          'text !px-2 truncate',
          activeEnvironment == null && 'text-text-subtlest italic',
        )}
        {...buttonProps}
      >
        {activeEnvironment?.name ?? 'Environment'}
      </Button>
    </Dropdown>
  );
});
