import React, { useState } from 'react';
import {
  PageSection,
  Title,
  Content,
  Card,
  CardBody,
  CardTitle,
  Stack,
  StackItem,
  Split,
  SplitItem,
  Button,
  Alert,
  Spinner,
  Bullseye,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Form,
  FormGroup,
  TextInput,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,

} from '@patternfly/react-core';
import { CubesIcon, PlusCircleIcon, TrashIcon, SyncAltIcon } from '@patternfly/react-icons';
import { useProjects } from '~/app/hooks/useProjects';
import {
  useK8sResources,
  createK8sResource,
  deleteK8sResource,
  K8sResource,
} from '~/app/hooks/useK8sResources';

type DeploymentResource = K8sResource & {
  spec: { replicas?: number };
  status: { readyReplicas?: number; availableReplicas?: number };
};

type ServiceResource = K8sResource & {
  spec: { ports?: { port: number; targetPort: number; protocol: string }[] };
};

const ResourceTable: React.FC<{
  resources: K8sResource[];
  kind: string;
  onDelete: (name: string) => void;
  deleting: { kind: string; name: string } | null;
}> = ({ resources, kind, onDelete, deleting }) => {
  if (resources.length === 0) {
    return (
      <Content component="p" className="pf-v6-u-color-200">
        No {kind.toLowerCase()}s found in this namespace.
      </Content>
    );
  }

  return (
    <table className="pf-v6-c-table pf-m-compact pf-m-grid-md" aria-label={`${kind} list`}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Created</th>
          <th>Status</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {resources.map((r) => (
          <tr key={r.metadata.uid}>
            <td>{r.metadata.name}</td>
            <td>{new Date(r.metadata.creationTimestamp).toLocaleString()}</td>
            <td>
              {kind === 'Deployment' ? (
                <Label color="blue">
                  {(r as DeploymentResource).status?.readyReplicas ?? 0}/
                  {(r as DeploymentResource).spec?.replicas ?? 0} ready
                </Label>
              ) : (
                <Label color="blue">Active</Label>
              )}
            </td>
            <td>
              <Button
                variant="plain"
                aria-label={`Delete ${r.metadata.name}`}
                onClick={() => onDelete(r.metadata.name)}
                isLoading={deleting?.kind === kind && deleting?.name === r.metadata.name}
                isDisabled={deleting !== null}
                icon={<TrashIcon />}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const CreateDeploymentModal: React.FC<{
  namespace: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}> = ({ namespace, isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [replicas, setReplicas] = useState('1');
  const [port, setPort] = useState('8080');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setImage('');
    setReplicas('1');
    setPort('8080');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      await createK8sResource(
        `/apis/apps/v1/namespaces/${namespace}/deployments`,
        {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          metadata: { name, namespace },
          spec: {
            replicas: parseInt(replicas, 10),
            selector: { matchLabels: { app: name } },
            template: {
              metadata: { labels: { app: name } },
              spec: {
                containers: [
                  {
                    name,
                    image,
                    ports: [{ containerPort: parseInt(port, 10) }],
                  },
                ],
              },
            },
          },
        },
      );
      onCreated();
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create deployment');
    } finally {
      setCreating(false);
    }
  };

  const isValid = name.length > 0 && image.length > 0;

  return (
    <Modal variant="medium" isOpen={isOpen} onClose={handleClose} aria-label="Create Deployment">
      <ModalHeader title="Create Deployment" />
      <ModalBody>
        <Form>
          {error && (
            <Alert variant="danger" title="Creation failed" isInline>
              {error}
            </Alert>
          )}
          <FormGroup label="Name" isRequired fieldId="deploy-name">
            <TextInput
              id="deploy-name"
              value={name}
              onChange={(_event, val) => setName(val)}
              isRequired
              aria-label="Deployment name"
            />
          </FormGroup>
          <FormGroup label="Container Image" isRequired fieldId="deploy-image">
            <TextInput
              id="deploy-image"
              value={image}
              onChange={(_event, val) => setImage(val)}
              placeholder="e.g. nginx:latest"
              isRequired
              aria-label="Container image"
            />
          </FormGroup>
          <FormGroup label="Replicas" fieldId="deploy-replicas">
            <TextInput
              id="deploy-replicas"
              type="number"
              value={replicas}
              onChange={(_event, val) => setReplicas(val)}
              aria-label="Replicas"
            />
          </FormGroup>
          <FormGroup label="Container Port" fieldId="deploy-port">
            <TextInput
              id="deploy-port"
              type="number"
              value={port}
              onChange={(_event, val) => setPort(val)}
              aria-label="Container port"
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={handleCreate}
          isDisabled={!isValid || creating}
          isLoading={creating}
        >
          Create
        </Button>
        <Button variant="link" onClick={handleClose} isDisabled={creating}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

const CreateServiceModal: React.FC<{
  namespace: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}> = ({ namespace, isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [port, setPort] = useState('80');
  const [targetPort, setTargetPort] = useState('8080');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setPort('80');
    setTargetPort('8080');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      await createK8sResource(`/api/v1/namespaces/${namespace}/services`, {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: { name, namespace },
        spec: {
          selector: { app: name },
          ports: [
            {
              port: parseInt(port, 10),
              targetPort: parseInt(targetPort, 10),
              protocol: 'TCP',
            },
          ],
        },
      });
      onCreated();
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create service');
    } finally {
      setCreating(false);
    }
  };

  const isValid = name.length > 0;

  return (
    <Modal variant="medium" isOpen={isOpen} onClose={handleClose} aria-label="Create Service">
      <ModalHeader title="Create Service" />
      <ModalBody>
        <Form>
          {error && (
            <Alert variant="danger" title="Creation failed" isInline>
              {error}
            </Alert>
          )}
          <FormGroup label="Name" isRequired fieldId="svc-name">
            <TextInput
              id="svc-name"
              value={name}
              onChange={(_event, val) => setName(val)}
              isRequired
              aria-label="Service name"
            />
          </FormGroup>
          <FormGroup label="Port" fieldId="svc-port">
            <TextInput
              id="svc-port"
              type="number"
              value={port}
              onChange={(_event, val) => setPort(val)}
              aria-label="Service port"
            />
          </FormGroup>
          <FormGroup label="Target Port" fieldId="svc-target-port">
            <TextInput
              id="svc-target-port"
              type="number"
              value={targetPort}
              onChange={(_event, val) => setTargetPort(val)}
              aria-label="Target port"
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={handleCreate}
          isDisabled={!isValid || creating}
          isLoading={creating}
        >
          Create
        </Button>
        <Button variant="link" onClick={handleClose} isDisabled={creating}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

const ClusterResourcesPage: React.FC = () => {
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isProjectSelectOpen, setIsProjectSelectOpen] = useState(false);

  const deploymentPath = selectedProject
    ? `/apis/apps/v1/namespaces/${selectedProject}/deployments`
    : null;
  const servicePath = selectedProject
    ? `/api/v1/namespaces/${selectedProject}/services`
    : null;

  const {
    items: deployments,
    loading: deploymentsLoading,
    error: deploymentsError,
    refresh: refreshDeployments,
  } = useK8sResources<DeploymentResource>(deploymentPath);

  const {
    items: services,
    loading: servicesLoading,
    error: servicesError,
    refresh: refreshServices,
  } = useK8sResources<ServiceResource>(servicePath);

  const [isCreateDeployOpen, setIsCreateDeployOpen] = useState(false);
  const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState<{ variant: 'success' | 'danger'; message: string } | null>(null);
  const [deleting, setDeleting] = useState<{ kind: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: string; name: string } | null>(null);

  const handleDeleteConfirm = (kind: string, name: string) => {
    setDeleteTarget({ kind, name });
  };

  const handleDelete = async () => {
    if (!deleteTarget || !selectedProject) return;

    const target = deleteTarget;
    setDeleteTarget(null);
    setDeleting(target);
    setDeleteAlert(null);

    try {
      const path =
        target.kind === 'Deployment'
          ? `/apis/apps/v1/namespaces/${selectedProject}/deployments/${target.name}`
          : `/api/v1/namespaces/${selectedProject}/services/${target.name}`;

      await deleteK8sResource(path);
      setDeleteAlert({
        variant: 'success',
        message: `${target.kind} "${target.name}" deleted successfully.`,
      });

      if (target.kind === 'Deployment') {
        refreshDeployments();
      } else {
        refreshServices();
      }
    } catch (e) {
      setDeleteAlert({
        variant: 'danger',
        message: e instanceof Error ? e.message : 'Delete failed',
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <PageSection>
      <Stack hasGutter>
        <StackItem>
          <Title headingLevel="h1" size="2xl">
            <CubesIcon /> Cluster Resources
          </Title>
          <Content component="p">
            This page demonstrates how to create, list, and delete Kubernetes resources through
            the dashboard&apos;s K8s API pass-through. All operations respect the authenticated
            user&apos;s RBAC permissions.
          </Content>
        </StackItem>

        {deleteAlert && (
          <StackItem>
            <Alert
              variant={deleteAlert.variant}
              title={deleteAlert.message}
              isInline
              timeout={5000}
              onTimeout={() => setDeleteAlert(null)}
            />
          </StackItem>
        )}

        <StackItem>
          <Card>
            <CardBody>
              <Stack hasGutter>
                <StackItem>
                  <Content component="p">
                    Select a project to manage resources.
                  </Content>
                </StackItem>
                <StackItem>
                  {projectsError ? (
                    <Alert variant="danger" title="Failed to load projects" isInline>
                      {projectsError}
                    </Alert>
                  ) : projectsLoading ? (
                    <Spinner size="md" aria-label="Loading projects" />
                  ) : (
                    <Select
                      isOpen={isProjectSelectOpen}
                      selected={selectedProject ?? undefined}
                      onSelect={(_event, value) => {
                        setSelectedProject(value as string);
                        setIsProjectSelectOpen(false);
                      }}
                      onOpenChange={setIsProjectSelectOpen}
                      toggle={(toggleRef) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() => setIsProjectSelectOpen(!isProjectSelectOpen)}
                          isExpanded={isProjectSelectOpen}
                          style={{ minWidth: '300px' }}
                          aria-label="Select a project"
                        >
                          {selectedProject || 'Select a project'}
                        </MenuToggle>
                      )}
                      shouldFocusToggleOnSelect
                    >
                      <SelectList>
                        {projects.map((p) => (
                          <SelectOption key={p.metadata.uid} value={p.metadata.name}>
                            {p.metadata.name}
                          </SelectOption>
                        ))}
                      </SelectList>
                    </Select>
                  )}
                </StackItem>
              </Stack>
            </CardBody>
          </Card>
        </StackItem>

        {selectedProject && (
          <>
            <StackItem>
              <Card>
                <CardTitle>
                  <Split hasGutter>
                    <SplitItem isFilled>Deployments</SplitItem>
                    <SplitItem>
                      <Button
                        variant="secondary"
                        icon={<SyncAltIcon />}
                        onClick={refreshDeployments}
                        aria-label="Refresh deployments"
                        isDisabled={deploymentsLoading}
                      />
                    </SplitItem>
                    <SplitItem>
                      <Button
                        variant="primary"
                        icon={<PlusCircleIcon />}
                        onClick={() => setIsCreateDeployOpen(true)}
                      >
                        Create Deployment
                      </Button>
                    </SplitItem>
                  </Split>
                </CardTitle>
                <CardBody>
                  {deploymentsError ? (
                    <Alert variant="danger" title="Failed to load deployments" isInline>
                      {deploymentsError}
                    </Alert>
                  ) : deploymentsLoading ? (
                    <Bullseye>
                      <Spinner aria-label="Loading deployments" />
                    </Bullseye>
                  ) : (
                    <ResourceTable
                      resources={deployments}
                      kind="Deployment"
                      onDelete={(name) => handleDeleteConfirm('Deployment', name)}
                      deleting={deleting}
                    />
                  )}
                </CardBody>
              </Card>
            </StackItem>

            <StackItem>
              <Card>
                <CardTitle>
                  <Split hasGutter>
                    <SplitItem isFilled>Services</SplitItem>
                    <SplitItem>
                      <Button
                        variant="secondary"
                        icon={<SyncAltIcon />}
                        onClick={refreshServices}
                        aria-label="Refresh services"
                        isDisabled={servicesLoading}
                      />
                    </SplitItem>
                    <SplitItem>
                      <Button
                        variant="primary"
                        icon={<PlusCircleIcon />}
                        onClick={() => setIsCreateServiceOpen(true)}
                      >
                        Create Service
                      </Button>
                    </SplitItem>
                  </Split>
                </CardTitle>
                <CardBody>
                  {servicesError ? (
                    <Alert variant="danger" title="Failed to load services" isInline>
                      {servicesError}
                    </Alert>
                  ) : servicesLoading ? (
                    <Bullseye>
                      <Spinner aria-label="Loading services" />
                    </Bullseye>
                  ) : (
                    <ResourceTable
                      resources={services}
                      kind="Service"
                      onDelete={(name) => handleDeleteConfirm('Service', name)}
                      deleting={deleting}
                    />
                  )}
                </CardBody>
              </Card>
            </StackItem>

            <CreateDeploymentModal
              namespace={selectedProject}
              isOpen={isCreateDeployOpen}
              onClose={() => setIsCreateDeployOpen(false)}
              onCreated={refreshDeployments}
            />

            <CreateServiceModal
              namespace={selectedProject}
              isOpen={isCreateServiceOpen}
              onClose={() => setIsCreateServiceOpen(false)}
              onCreated={refreshServices}
            />

            <Modal
              variant="small"
              isOpen={deleteTarget !== null}
              onClose={() => setDeleteTarget(null)}
              aria-label="Confirm deletion"
            >
              <ModalHeader title="Confirm Deletion" />
              <ModalBody>
                Are you sure you want to delete {deleteTarget?.kind.toLowerCase()}{' '}
                <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
              </ModalBody>
              <ModalFooter>
                <Button variant="danger" onClick={handleDelete}>
                  Delete
                </Button>
                <Button variant="link" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </Button>
              </ModalFooter>
            </Modal>
          </>
        )}
      </Stack>
    </PageSection>
  );
};

export default ClusterResourcesPage;
