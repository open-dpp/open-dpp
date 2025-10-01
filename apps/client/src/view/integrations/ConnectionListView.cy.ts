import { createMemoryHistory, createRouter } from 'vue-router';

import { API_URL, PRO_ALPHA_INTEGRATION_ID } from '../../const';
import { routes } from '../../router';
import { AasConnectionGetAllDto } from '@open-dpp/api-client';
import { useIndexStore } from '../../stores';
import ConnectionListView from './ConnectionListView.vue';

const router = createRouter({
  history: createMemoryHistory(),
  routes: routes,
});

describe('<ConnectionListView />', () => {
  it('renders drafts and creates a new one', () => {
    const aasConnections: AasConnectionGetAllDto[] = [
      {
        id: 'conn1',
        name: 'My first connection',
      },
      {
        id: 'conn2',
        name: 'My second connection',
      },
    ];

    const orgaId = 'orgaId';

    cy.intercept(
      'GET',
      `${API_URL}/organizations/${orgaId}/integration/aas/connections`,
      {
        statusCode: 200,
        body: aasConnections, // Mock response
      },
    ).as('getConnections');

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);
    cy.wrap(
      router.push(
        `/organizations/${orgaId}/integration/${PRO_ALPHA_INTEGRATION_ID}`,
      ),
    );
    cy.mountWithPinia(ConnectionListView, { router });

    cy.spy(router, 'push').as('pushSpy');

    cy.wait('@getConnections').its('response.statusCode').should('eq', 200);
    cy.contains('Verbindungen').should('be.visible');
    cy.contains('Alle Ihre Verbindungen').should('be.visible');
    aasConnections.forEach((d, index) => {
      const testId = `row-${index}`;
      const row = cy.get(`[data-cy="${testId}"]`);
      row.within(() => cy.contains(d.name).should('be.visible'));
      row.within(() => cy.contains('Editieren').click());
      cy.get('@pushSpy').should(
        'have.been.calledWith',
        `/organizations/${orgaId}/integrations/pro-alpha/connections/${d.id}`,
      );
    });
    cy.contains('Verbindung erstellen').click();
    cy.get('@pushSpy').should(
      'have.been.calledWith',
      `/organizations/${orgaId}/integrations/pro-alpha/connections/create`,
    );
  });

  it('should fetch empty drafts on render and create first draft', () => {
    const orgaId = 'orgaId';

    cy.intercept(
      'GET',
      `${API_URL}/organizations/${orgaId}/integration/aas/connections`,
      {
        statusCode: 200,
        body: [], // Mock response
      },
    ).as('getConnections');

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);
    cy.spy(router, 'push').as('pushSpy');
    cy.wrap(
      router.push(
        `/organizations/${orgaId}/integrations/${PRO_ALPHA_INTEGRATION_ID}`,
      ),
    );
    cy.mountWithPinia(ConnectionListView, { router });

    cy.wait('@getConnections').its('response.statusCode').should('eq', 200);
    cy.contains('Neue Verbindung hinzufügen').click();
    cy.get('@pushSpy').should(
      'have.been.calledWith',
      `/organizations/${orgaId}/integrations/pro-alpha/connections/create`,
    );
  });
});
