import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "../../users/infrastructure/user.entity";

@Entity("Organization")
export class OrganizationEntity {
  @PrimaryColumn("uuid")
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;

  @Column()
  name: string;

  @Column("char", {
    name: "createdByUserId",
  })
  createdByUserId: string;

  @ManyToOne(() => UserEntity, user => user.creatorOfOrganizations, {
    cascade: ["insert"],
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "createdByUserId", referencedColumnName: "id" }])
  createdByUser: UserEntity;

  @Column("char", {
    name: "ownedByUserId",
  })
  ownedByUserId: string;

  @ManyToOne(() => UserEntity, user => user.ownerOfOrganizations, {
    cascade: ["insert"],
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "ownedByUserId", referencedColumnName: "id" }])
  ownedByUser: UserEntity;

  @ManyToMany(() => UserEntity, user => user.organizations, {
    cascade: ["insert"],
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  members: UserEntity[];
}
