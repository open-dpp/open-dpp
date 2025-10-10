import { AbilityBuilder, createMongoAbility } from "@casl/ability";

function defineAbilitiesFor(userId: string, organizationMembers: string[]) {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  // can read blog posts
  can("read", "BlogPost");
  // can manage (i.e., do anything) own posts
  can("manage", "BlogPost", { author: user.id });
  // cannot delete a post if it was created more than a day ago
  cannot("delete", "BlogPost", {
    createdAt: { $lt: Date.now() - 24 * 60 * 60 * 1000 },
  });

  return build();
}
