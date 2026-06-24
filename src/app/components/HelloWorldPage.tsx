import React from 'react';
import {
  PageSection,
  Text,
  TextContent,
  TextVariants,
  Title,
  Flex,
  FlexItem,
  Button,
  Alert,
  AlertVariant,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { CheckCircleIcon, TerminalIcon } from '@patternfly/react-icons';

const HelloWorldPage: React.FC = () => {
  const [clickCount, setClickCount] = React.useState(0);
  const [showAlert, setShowAlert] = React.useState(false);

  const handleButtonClick = () => {
    setClickCount((prev) => prev + 1);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  return (
    <PageSection variant="light">
      <Stack>
        <StackItem>
          <Flex justifyContent={{ default: 'justifyContentCenter' }}>
            <FlexItem>
              <Title headingLevel="h1" size="xl">
                <TerminalIcon color="#6b21a8" /> Hello World Plugin
              </Title>
            </FlexItem>
          </Flex>
        </StackItem>

        <StackItem>
          <Flex justifyContent={{ default: 'justifyContentCenter' }}>
            <FlexItem>
              <Alert
                variant={AlertVariant.success}
                title="Welcome to RHOAI!"
                isInline
                isVisible={showAlert}
                onClose={() => setShowAlert(false)}
              >
                This is your first RHOAI community plugin!
              </Alert>
            </FlexItem>
          </Flex>
        </StackItem>

        <StackItem>
          <Flex
            justifyContent={{ default: 'justifyContentCenter' }}
            display={{ default: 'displayFlex' }}
          >
            <FlexItem>
              <TextContent>
                <Text component={TextVariants.p}>
                  This is a simple <strong>Hello World</strong> plugin for the Red Hat OpenShift
                  AI (RHOAI) Dashboard. It demonstrates how to create a community plugin that
                  integrates with the dashboard using Module Federation.
                </Text>
              </TextContent>
            </FlexItem>
          </Flex>
        </StackItem>

        <StackItem>
          <Flex
            justifyContent={{ default: 'justifyContentCenter' }}
            display={{ default: 'displayFlex' }}
          >
            <FlexItem>
              <Button
                variant="primary"
                icon={<CheckCircleIcon />}
                onClick={handleButtonClick}
              >
                Click Me! ({clickCount})
              </Button>
            </FlexItem>
          </Flex>
        </StackItem>

        <StackItem>
          <Flex
            justifyContent={{ default: 'justifyContentCenter' }}
            display={{ default: 'displayFlex' }}
          >
            <FlexItem>
              <TextContent>
                <Text component={TextVariants.small} color="color2">
                  Plugin Version: 0.1.0 | Deployment Mode: Module Federation
                </Text>
              </TextContent>
            </FlexItem>
          </Flex>
        </StackItem>
      </Stack>
    </PageSection>
  );
};

export default HelloWorldPage;
