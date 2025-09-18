import { createMemoryHistory, createRouter } from 'vue-router';

import { API_URL } from '../../const';
import { routes } from '../../router';
import { useIndexStore } from '../../stores';
import CreateConnectionView from './CreateConnectionView.vue';
import { AssetAdministrationShellType } from '@open-dpp/api-client';

const router = createRouter({
  history: createMemoryHistory(),
  routes: routes,
});

describe('<CreateConnectionView />', () => {
  it('creates connection with selected model', () => {
    const model1 = { id: 'm1', name: 'Model 1', templateId: 'dm1' };
    const model2 = { id: 'm2', name: 'Model 2', templateId: 'dm2' };

    const orgaId = 'orgaId';

    cy.intercept('GET', `${API_URL}/organizations/${orgaId}/models`, {
      statusCode: 200,
      body: [model1, model2], // Mock response
    }).as('getModels');

    const connectionId = 'mid1';
    cy.intercept(
      'POST',
      `${API_URL}/organizations/${orgaId}/integration/aas/connections`,
      {
        statusCode: 201,
        body: { id: connectionId }, // Mock response
      },
    ).as('createConnection');

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);
    cy.wrap(
      router.push(
        `/organizations/${orgaId}/integrations/pro-alpha/connections/create`,
      ),
    );
    cy.spy(router, 'push').as('pushSpy');
    cy.mountWithPinia(CreateConnectionView, {
      router,
    });
    cy.wait('@getModels').its('response.statusCode').should('eq', 200);
    cy.get('[data-cy="name"]').type('My first connection');
    cy.get('[data-cy="select-model"]').select(`${model2.name} ${model2.id}`);
    cy.get('[data-cy="select-aas-type"]').select('Semitrailer');
    cy.contains('button', 'Erstellen').click();

    cy.wait('@createConnection').then(({ request }) => {
      const expected = {
        name: 'My first connection',
        aasType: AssetAdministrationShellType.Semitrailer,
        modelId: model2.id,
        dataModelId: model2.templateId,
        fieldAssignments: [],
      };
      cy.expectDeepEqualWithDiff(request.body, expected);
    });
    cy.get('@pushSpy').should(
      'have.been.calledWith',
      `/organizations/${orgaId}/integrations/pro-alpha/connections/${connectionId}`,
    );
  });
});
