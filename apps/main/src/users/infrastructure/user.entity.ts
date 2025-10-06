import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { OrganizationEntity } from "../../organizations/infrastructure/organization.entity";

@Entity("user")
export class UserEntity {
  @PrimaryColumn()
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;

  @Column()
  email: string;

  @ManyToMany(
    () => OrganizationEntity,
    organization => organization.members,
    {
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  )
  @JoinTable({
    name: "organization_user",
    joinColumns: [{ name: "user_id", referencedColumnName: "id" }],
    inverseJoinColumns: [
      { name: "organization_id", referencedColumnName: "id" },
    ],
  })
  organizations: Relation<OrganizationEntity>[];

  @OneToMany(() => OrganizationEntity, org => org.createdByUser)
  creatorOfOrganizations: Relation<OrganizationEntity>[];

  @OneToMany(() => OrganizationEntity, org => org.ownedByUser)
  ownerOfOrganizations: Relation<OrganizationEntity>[];
}
