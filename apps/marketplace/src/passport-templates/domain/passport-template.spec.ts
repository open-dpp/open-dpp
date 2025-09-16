import { PassportTemplate, Sector } from './passport-template';
import { passportTemplatePropsFactory } from '../fixtures/passport-template-props.factory';

describe('PassportTemplate', () => {
  it('is created', () => {
    const props = passportTemplatePropsFactory.build();

    const passportTemplate = PassportTemplate.create(props);
    expect(passportTemplate).toBeInstanceOf(PassportTemplate);
    expect(passportTemplate.id).toEqual(expect.any(String));
    expect(passportTemplate.name).toEqual('test');
    expect(passportTemplate.description).toEqual('test description');
    expect(passportTemplate.isOfficial).toEqual(true);
    expect(passportTemplate.sectors).toEqual([Sector.BATTERY]);
    expect(passportTemplate.website).toEqual('https://open-dpp.de');
    expect(passportTemplate.contactEmail).toEqual('test@example.com');
    expect(passportTemplate.organizationName).toEqual('open-dpp');
    expect(passportTemplate.templateData).toEqual(props.templateData);
    expect(passportTemplate.ownedByOrganizationId).toEqual(
      props.ownedByOrganizationId,
    );
    expect(passportTemplate.createdByUserId).toEqual(props.createdByUserId);
    expect(passportTemplate.createdAt).toBeDefined();
    expect(passportTemplate.createdAt).toBeInstanceOf(Date);
  });
  it('is loaded from database', () => {
    const props = passportTemplatePropsFactory.build();

    const passportTemplate = PassportTemplate.loadFromDb(props);
    expect(passportTemplate).toBeInstanceOf(PassportTemplate);
    expect(passportTemplate.id).toEqual(props.id);
    expect(passportTemplate.name).toEqual('test');
    expect(passportTemplate.description).toEqual('test description');
    expect(passportTemplate.isOfficial).toEqual(true);
    expect(passportTemplate.sectors).toEqual([Sector.BATTERY]);
    expect(passportTemplate.website).toEqual('https://open-dpp.de');
    expect(passportTemplate.contactEmail).toEqual('test@example.com');
    expect(passportTemplate.organizationName).toEqual('open-dpp');
    expect(passportTemplate.templateData).toEqual(props.templateData);
    expect(passportTemplate.ownedByOrganizationId).toEqual(
      props.ownedByOrganizationId,
    );
    expect(passportTemplate.createdByUserId).toEqual(props.createdByUserId);
  });
});
