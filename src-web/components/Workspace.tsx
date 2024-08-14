import classNames from 'classnames';
import { motion } from 'framer-motion';
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useWindowSize } from 'react-use';
import { useActiveRequest } from '../hooks/useActiveRequest';
import { useActiveWorkspace } from '../hooks/useActiveWorkspace';
import { useFloatingSidebarHidden } from '../hooks/useFloatingSidebarHidden';
import { useImportData } from '../hooks/useImportData';
import { useShouldFloatSidebar } from '../hooks/useShouldFloatSidebar';
import { useSidebarHidden } from '../hooks/useSidebarHidden';
import { useSidebarWidth } from '../hooks/useSidebarWidth';
import { useSyncWorkspaceRequestTitle } from '../hooks/useSyncWorkspaceRequestTitle';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { Banner } from './core/Banner';
import { Button } from './core/Button';
import { HotKeyList } from './core/HotKeyList';
import { FeedbackLink } from './core/Link';
import { HStack } from './core/Stacks';
import { CreateDropdown } from './CreateDropdown';
import { GrpcConnectionLayout } from './GrpcConnectionLayout';
import { HeaderSize } from './HeaderSize';
import { HttpRequestLayout } from './HttpRequestLayout';
import { Overlay } from './Overlay';
import { ResizeHandle } from './ResizeHandle';
import { Sidebar } from './Sidebar';
import { SidebarActions } from './SidebarActions';
import { WorkspaceHeader } from './WorkspaceHeader';

const side = { gridArea: 'side' };
const head = { gridArea: 'head' };
const body = { gridArea: 'body' };
const drag = { gridArea: 'drag' };

export default function Workspace() {
  useSyncWorkspaceRequestTitle();
  const workspaces = useWorkspaces();
  const activeWorkspace = useActiveWorkspace();
  const { setWidth, width, resetWidth } = useSidebarWidth();
  const [sidebarHidden, setSidebarHidden] = useSidebarHidden();
  const [floatingSidebarHidden, setFloatingSidebarHidden] = useFloatingSidebarHidden();
  const activeRequest = useActiveRequest();
  const windowSize = useWindowSize();
  const importData = useImportData();
  const floating = useShouldFloatSidebar();
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const moveState = useRef<{ move: (e: MouseEvent) => void; up: (e: MouseEvent) => void } | null>(
    null,
  );

  const unsub = () => {
    if (moveState.current !== null) {
      document.documentElement.removeEventListener('mousemove', moveState.current.move);
      document.documentElement.removeEventListener('mouseup', moveState.current.up);
    }
  };

  const handleResizeStart = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (width === undefined) return;

      unsub();
      const mouseStartX = e.clientX;
      const startWidth = width;
      moveState.current = {
        move: async (e: MouseEvent) => {
          e.preventDefault(); // Prevent text selection and things
          const newWidth = startWidth + (e.clientX - mouseStartX);
          if (newWidth < 50) {
            await setSidebarHidden(true);
            resetWidth();
          } else {
            await setSidebarHidden(false);
            setWidth(newWidth);
          }
        },
        up: (e: MouseEvent) => {
          e.preventDefault();
          unsub();
          setIsResizing(false);
        },
      };
      document.documentElement.addEventListener('mousemove', moveState.current.move);
      document.documentElement.addEventListener('mouseup', moveState.current.up);
      setIsResizing(true);
    },
    [width, setSidebarHidden, resetWidth, setWidth],
  );

  const sideWidth = sidebarHidden ? 0 : width;
  const styles = useMemo<CSSProperties>(
    () => ({
      gridTemplate: floating
        ? `
        ' ${head.gridArea}' auto
        ' ${body.gridArea}' minmax(0,1fr)
        / 1fr`
        : `
        ' ${head.gridArea} ${head.gridArea} ${head.gridArea}' auto
        ' ${side.gridArea} ${drag.gridArea} ${body.gridArea}' minmax(0,1fr)
        / ${sideWidth}px   0                1fr`,
    }),
    [sideWidth, floating],
  );

  if (windowSize.width <= 100) {
    return (
      <div>
        <Button>Send</Button>
      </div>
    );
  }

  // We're loading still
  if (workspaces.length === 0) {
    return null;
  }

  return (
    <div
      style={styles}
      className={classNames(
        'grid w-full h-full',
        // Animate sidebar width changes but only when not resizing
        // because it's too slow to animate on mouse move
        !isResizing && 'transition-grid',
      )}
    >
      {floating ? (
        <Overlay
          open={!floatingSidebarHidden}
          portalName="sidebar"
          onClose={() => setFloatingSidebarHidden(true)}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={classNames(
              'x-theme-sidebar',
              'absolute top-0 left-0 bottom-0 bg-surface border-r border-border-subtle w-[14rem]',
              'grid grid-rows-[auto_1fr]',
            )}
          >
            <HeaderSize size="lg" className="border-transparent">
              <SidebarActions />
            </HeaderSize>
            <Sidebar />
          </motion.div>
        </Overlay>
      ) : (
        <>
          <div style={side} className={classNames('x-theme-sidebar', 'overflow-hidden bg-surface')}>
            <Sidebar className="border-r border-border-subtle" />
          </div>
          <ResizeHandle
            className="-translate-x-3"
            justify="end"
            side="right"
            isResizing={isResizing}
            onResizeStart={handleResizeStart}
            onReset={resetWidth}
          />
        </>
      )}
      <HeaderSize
        data-tauri-drag-region
        size="lg"
        className="x-theme-appHeader bg-surface"
        style={head}
      >
        <WorkspaceHeader className="pointer-events-none" />
      </HeaderSize>
      {activeWorkspace == null ? (
        <div className="m-auto">
          <Banner color="warning" className="max-w-[30rem]">
            The active workspace was not found. Select a workspace from the header menu or report
            this bug to <FeedbackLink />
          </Banner>
        </div>
      ) : activeRequest == null ? (
        <HotKeyList
          hotkeys={['http_request.create', 'sidebar.focus', 'settings.show']}
          bottomSlot={
            <HStack space={1} justifyContent="center" className="mt-3">
              <Button variant="border" size="sm" onClick={() => importData.mutate()}>
                Import
              </Button>
              <CreateDropdown hideFolder>
                <Button variant="border" forDropdown size="sm">
                  New Request
                </Button>
              </CreateDropdown>
            </HStack>
          }
        />
      ) : activeRequest.model === 'grpc_request' ? (
        <GrpcConnectionLayout style={body} />
      ) : (
        <HttpRequestLayout activeRequest={activeRequest} style={body} />
      )}
    </div>
  );
}
