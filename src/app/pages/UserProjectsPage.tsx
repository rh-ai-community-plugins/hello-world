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
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Spinner,
  Bullseye,
  Alert,
  Label,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
} from '@patternfly/react-core';
import { UserIcon, FolderIcon } from '@patternfly/react-icons';
import { useCurrentUser } from '~/app/hooks/useCurrentUser';
import { useProjects } from '~/app/hooks/useProjects';
import { useAccessReview, AccessReviewResult } from '~/app/hooks/useAccessReview';

const PermissionsTable: React.FC<{ results: AccessReviewResult[] }> = ({ results }) => {
  const resources = [...new Set(results.map((r) => r.resource))];
  const verbs = [...new Set(results.map((r) => r.verb))];

  return (
    <table className="pf-v6-c-table pf-m-compact pf-m-grid-md" aria-label="RBAC permissions">
      <thead>
        <tr>
          <th>Resource</th>
          {verbs.map((v) => (
            <th key={v}>{v}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {resources.map((resource) => (
          <tr key={resource}>
            <td>{resource}</td>
            {verbs.map((verb) => {
              const check = results.find(
                (r) => r.resource === resource && r.verb === verb,
              );
              return (
                <td key={verb}>
                  <Label color={check?.allowed ? 'green' : 'red'}>
                    {check?.allowed ? 'Yes' : 'No'}
                  </Label>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const UserProjectsPage: React.FC = () => {
  const { user, loading: userLoading, error: userError } = useCurrentUser();
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isProjectSelectOpen, setIsProjectSelectOpen] = useState(false);
  const { results: accessResults, loading: accessLoading } = useAccessReview(selectedProject);

  if (userLoading) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner aria-label="Loading user information" />
        </Bullseye>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Stack hasGutter>
        <StackItem>
          <Title headingLevel="h1" size="2xl">
            <UserIcon /> Hello, welcome to your plugin example
          </Title>
          <Content component="p">
            This page demonstrates how to retrieve and display the authenticated user&apos;s
            information, list accessible projects, and check RBAC permissions — all through the
            dashboard&apos;s backend APIs.
          </Content>
        </StackItem>

        {userError && (
          <StackItem>
            <Alert variant="danger" title="Failed to load user information" isInline>
              {userError}
            </Alert>
          </StackItem>
        )}

        {user && (
          <StackItem>
            <Card>
              <CardTitle>
                <UserIcon /> User Information
              </CardTitle>
              <CardBody>
                <DescriptionList isHorizontal>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Username</DescriptionListTerm>
                    <DescriptionListDescription>{user.userName}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>User ID</DescriptionListTerm>
                    <DescriptionListDescription>{user.userID}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Admin</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Label color={user.isAdmin ? 'green' : 'blue'}>
                        {user.isAdmin ? 'Yes' : 'No'}
                      </Label>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Cluster ID</DescriptionListTerm>
                    <DescriptionListDescription>{user.clusterID}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Cluster Branding</DescriptionListTerm>
                    <DescriptionListDescription>{user.clusterBranding}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Default Namespace</DescriptionListTerm>
                    <DescriptionListDescription>{user.namespace}</DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>
          </StackItem>
        )}

        <StackItem>
          <Card>
            <CardTitle>
              <FolderIcon /> Projects
            </CardTitle>
            <CardBody>
              <Stack hasGutter>
                <StackItem>
                  <Content component="p">
                    Select a project to view your RBAC permissions in that namespace.
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

                {selectedProject && (
                  <StackItem>
                    <Title headingLevel="h3" size="md">
                      Permissions in {selectedProject}
                    </Title>
                    {accessLoading ? (
                      <Spinner size="md" aria-label="Checking permissions" />
                    ) : (
                      <PermissionsTable results={accessResults} />
                    )}
                  </StackItem>
                )}
              </Stack>
            </CardBody>
          </Card>
        </StackItem>
      </Stack>
    </PageSection>
  );
};

export default UserProjectsPage;
