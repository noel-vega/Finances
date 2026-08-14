// Seeds a demo comic book shop ("Longbox Comics") with brands, categories,
// and products so local dev/testing never starts from an empty catalog.
// Re-runnable: every entity is looked up by its natural key before insert,
// so running this again only adds whatever's missing (e.g. new products
// appended to the list below) — it never duplicates existing rows.
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import {
  db,
  eq,
  and,
  sql,
  accountsTable,
  usersTable,
  locationsTable,
  accountApiKeysTable,
  brandsTable,
  categoriesTable,
  productsTable,
  productCategoriesTable,
  productOptionsTable,
  productOptionValuesTable,
  productVariantsTable,
  variantOptionValuesTable,
  inventoryTable,
  permissionsTable,
  rolesTable,
  rolePermissionsTable,
  userRolesTable,
  PERMISSIONS_CATALOG,
  isUniqueViolation,
} from '../src/index.js';

const OWNER_EMAIL = 'owner@longboxcomics.test';
const OWNER_PASSWORD = 'password123';

const BRANDS = [
  'Marvel Comics',
  'DC Comics',
  'Image Comics',
  'Dark Horse Comics',
  'IDW Publishing',
  'Longbox Essentials',
] as const;

const CATEGORIES = [
  'Comics',
  'Graphic Novels',
  'Trading Cards',
  'Action Figures',
  'Apparel',
  'Board Games',
  'Supplies',
] as const;

interface SeedVariant {
  optionValue?: string;
  priceCents: number;
  stock: number;
}

interface SeedProduct {
  name: string;
  description: string;
  brand: (typeof BRANDS)[number];
  categories: (typeof CATEGORIES)[number][];
  optionName?: string;
  variants: SeedVariant[];
}

const PRODUCTS: SeedProduct[] = [
  {
    name: 'Amazing Spider-Man #1',
    description:
      'The wall-crawler swings back into a bold new era. Available with two collectible covers.',
    brand: 'Marvel Comics',
    categories: ['Comics'],
    optionName: 'Cover',
    variants: [
      { optionValue: 'A Cover', priceCents: 499, stock: 25 },
      { optionValue: 'B Cover', priceCents: 599, stock: 10 },
    ],
  },
  {
    name: 'Batman: Year One',
    description:
      "Frank Miller and David Mazzucchelli's definitive origin story for the Dark Knight.",
    brand: 'DC Comics',
    categories: ['Graphic Novels'],
    variants: [{ priceCents: 1999, stock: 12 }],
  },
  {
    name: 'Saga, Vol. 1',
    description: "Brian K. Vaughan and Fiona Staples' epic space opera begins.",
    brand: 'Image Comics',
    categories: ['Graphic Novels'],
    variants: [{ priceCents: 999, stock: 18 }],
  },
  {
    name: 'Hellboy: Seed of Destruction',
    description: "Mike Mignola's paranormal investigator makes his collected debut.",
    brand: 'Dark Horse Comics',
    categories: ['Graphic Novels'],
    variants: [{ priceCents: 1799, stock: 10 }],
  },
  {
    name: 'Teenage Mutant Ninja Turtles #1',
    description: 'The heroes in a half shell return in this fan-favorite relaunch.',
    brand: 'IDW Publishing',
    categories: ['Comics'],
    optionName: 'Cover',
    variants: [
      { optionValue: 'Regular', priceCents: 399, stock: 30 },
      { optionValue: 'Retailer Incentive', priceCents: 1499, stock: 5 },
    ],
  },
  {
    name: 'Watchmen',
    description: 'Alan Moore and Dave Gibbons redefine what a superhero comic can be.',
    brand: 'DC Comics',
    categories: ['Graphic Novels'],
    variants: [{ priceCents: 1999, stock: 15 }],
  },
  {
    name: 'The Walking Dead Compendium One',
    description: 'The first 48 issues of the zombie survival saga, collected in one volume.',
    brand: 'Image Comics',
    categories: ['Graphic Novels'],
    variants: [{ priceCents: 2499, stock: 8 }],
  },
  {
    name: 'Marvel Trading Card Booster Pack',
    description: 'Chase your favorite heroes and villains in every foil pack.',
    brand: 'Marvel Comics',
    categories: ['Trading Cards'],
    optionName: 'Pack Size',
    variants: [
      { optionValue: 'Single Pack', priceCents: 499, stock: 40 },
      { optionValue: 'Booster Box', priceCents: 8999, stock: 6 },
    ],
  },
  {
    name: 'Spider-Man 6-Inch Action Figure',
    description: 'Highly detailed, fully articulated figure straight off the page.',
    brand: 'Marvel Comics',
    categories: ['Action Figures'],
    variants: [{ priceCents: 2499, stock: 14 }],
  },
  {
    name: 'Batman Logo T-Shirt',
    description: 'Classic bat-symbol tee, pre-shrunk cotton.',
    brand: 'DC Comics',
    categories: ['Apparel'],
    optionName: 'Size',
    variants: [
      { optionValue: 'Small', priceCents: 2299, stock: 10 },
      { optionValue: 'Medium', priceCents: 2299, stock: 10 },
      { optionValue: 'Large', priceCents: 2299, stock: 10 },
      { optionValue: 'X-Large', priceCents: 2299, stock: 8 },
    ],
  },
  {
    name: 'X-Men Trading Card Set',
    description: 'A complete base set featuring the classic roster.',
    brand: 'Marvel Comics',
    categories: ['Trading Cards'],
    variants: [{ priceCents: 5999, stock: 5 }],
  },
  {
    name: 'Hellboy Board Game',
    description: 'Cooperative board game based on the Dark Horse universe.',
    brand: 'Dark Horse Comics',
    categories: ['Board Games'],
    variants: [{ priceCents: 4999, stock: 6 }],
  },
  {
    name: 'Comic Book Long Box',
    description: 'Holds up to 300 standard comics. Sturdy corrugated cardboard.',
    brand: 'Longbox Essentials',
    categories: ['Supplies'],
    variants: [{ priceCents: 699, stock: 50 }],
  },
  {
    name: 'Acid-Free Comic Bags & Boards (100ct)',
    description: 'Archival-quality bags and boards to keep your books pristine.',
    brand: 'Longbox Essentials',
    categories: ['Supplies'],
    variants: [{ priceCents: 1299, stock: 40 }],
  },
  {
    name: 'Wolverine 12-Inch Action Figure',
    description: 'Premium scale figure with swappable claws and portrait.',
    brand: 'Marvel Comics',
    categories: ['Action Figures'],
    variants: [{ priceCents: 3999, stock: 7 }],
  },
];

function generateApiKey(): string {
  return `sfk_${randomBytes(24).toString('base64url')}`;
}

async function ensureAccount() {
  const [existingUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, OWNER_EMAIL));

  if (existingUser) {
    const [account] = await db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.id, existingUser.accountId));
    return account;
  }

  const hashedPassword = await bcrypt.hash(OWNER_PASSWORD, 10);
  return await db.transaction(async (tx) => {
    const [account] = await tx
      .insert(accountsTable)
      .values({ name: 'Longbox Comics', phone: '5555550100', email: OWNER_EMAIL })
      .returning();

    await tx.insert(usersTable).values({
      accountId: account.id,
      firstname: 'Longbox',
      lastname: 'Owner',
      email: OWNER_EMAIL,
      password: hashedPassword,
    });

    return account;
  });
}

// mirrors PermissionsService.onModuleInit() in shop-admin-api — seed.ts
// runs standalone, so it can't rely on the API ever having booted
async function ensurePermissionsCatalog() {
  await db
    .insert(permissionsTable)
    .values(PERMISSIONS_CATALOG)
    .onConflictDoUpdate({
      target: permissionsTable.key,
      set: {
        resource: sql`excluded.resource`,
        action: sql`excluded.action`,
        description: sql`excluded.description`,
      },
    });
}

// mirrors RolesService.createSystemRole() in shop-admin-api
async function ensureOwnerRole(accountId: number, userId: number) {
  const findExisting = () =>
    db
      .select()
      .from(rolesTable)
      .where(and(eq(rolesTable.accountId, accountId), eq(rolesTable.isSystem, true)))
      .then(([row]) => row);

  const existing = await findExisting();
  if (existing) return existing;

  try {
    return await db.transaction(async (tx) => {
      const [role] = await tx
        .insert(rolesTable)
        .values({
          accountId,
          name: 'Owner',
          description: 'Full access to everything',
          isSystem: true,
        })
        .returning();

      const allPermissions = await tx.select({ id: permissionsTable.id }).from(permissionsTable);
      if (allPermissions.length > 0) {
        await tx
          .insert(rolePermissionsTable)
          .values(allPermissions.map((p) => ({ roleId: role.id, permissionId: p.id })));
      }

      await tx.insert(userRolesTable).values({ userId, roleId: role.id });
      return role;
    });
  } catch (err) {
    // two concurrent seed runs can both pass the check above before either
    // inserts — the (accountId, name) unique constraint lets one win
    if (isUniqueViolation(err)) {
      const existing = await findExisting();
      if (existing) return existing;
    }
    throw err;
  }
}

async function ensureDefaultLocation(accountId: number) {
  const [existing] = await db
    .select()
    .from(locationsTable)
    .where(and(eq(locationsTable.accountId, accountId), eq(locationsTable.name, 'Default')));
  if (existing) return existing;

  const [location] = await db
    .insert(locationsTable)
    .values({ accountId, name: 'Default' })
    .returning();
  return location;
}

async function ensureApiKey(accountId: number) {
  const [existing] = await db
    .select()
    .from(accountApiKeysTable)
    .where(eq(accountApiKeysTable.accountId, accountId));
  if (existing) return existing;

  const [key] = await db
    .insert(accountApiKeysTable)
    .values({ accountId, key: generateApiKey(), label: 'Seed default' })
    .returning();
  console.log(`Created storefront API key: ${key.key}`);
  return key;
}

async function ensureBrands(accountId: number) {
  const map = new Map<string, number>();
  for (const name of BRANDS) {
    const [existing] = await db
      .select()
      .from(brandsTable)
      .where(and(eq(brandsTable.accountId, accountId), eq(brandsTable.name, name)));
    if (existing) {
      map.set(name, existing.id);
      continue;
    }
    const [brand] = await db.insert(brandsTable).values({ accountId, name }).returning();
    map.set(name, brand.id);
  }
  return map;
}

async function ensureCategories(accountId: number) {
  const map = new Map<string, number>();
  for (const name of CATEGORIES) {
    const [existing] = await db
      .select()
      .from(categoriesTable)
      .where(and(eq(categoriesTable.accountId, accountId), eq(categoriesTable.name, name)));
    if (existing) {
      map.set(name, existing.id);
      continue;
    }
    const [category] = await db.insert(categoriesTable).values({ accountId, name }).returning();
    map.set(name, category.id);
  }
  return map;
}

// returns false (and does nothing) if a product with this name already
// exists for the account — the idempotency check
async function ensureProduct(
  product: SeedProduct,
  accountId: number,
  locationId: number,
  brandsByName: Map<string, number>,
  categoriesByName: Map<string, number>,
): Promise<boolean> {
  const [existing] = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(and(eq(productsTable.accountId, accountId), eq(productsTable.name, product.name)));
  if (existing) return false;

  await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(productsTable)
      .values({
        accountId,
        name: product.name,
        description: product.description,
        status: 'active',
        brandId: brandsByName.get(product.brand) ?? null,
      })
      .returning();

    if (product.categories.length > 0) {
      await tx.insert(productCategoriesTable).values(
        product.categories.map((name) => ({
          productId: row.id,
          categoryId: categoriesByName.get(name)!,
        })),
      );
    }

    const optionValueIdByValue = new Map<string, number>();
    if (product.optionName) {
      const [option] = await tx
        .insert(productOptionsTable)
        .values({ productId: row.id, name: product.optionName })
        .returning();

      const values = [
        ...new Set(product.variants.map((v) => v.optionValue).filter((v): v is string => !!v)),
      ];
      for (const value of values) {
        const [optionValue] = await tx
          .insert(productOptionValuesTable)
          .values({ optionId: option.id, value })
          .returning();
        optionValueIdByValue.set(value, optionValue.id);
      }
    }

    for (const variant of product.variants) {
      const [variantRow] = await tx
        .insert(productVariantsTable)
        .values({ productId: row.id, priceCents: variant.priceCents })
        .returning();

      const optionValueId = variant.optionValue
        ? optionValueIdByValue.get(variant.optionValue)
        : undefined;
      if (optionValueId) {
        await tx
          .insert(variantOptionValuesTable)
          .values({ variantId: variantRow.id, optionValueId });
      }

      await tx
        .insert(inventoryTable)
        .values({ variantId: variantRow.id, locationId, stock: variant.stock });
    }
  });

  return true;
}

async function main() {
  console.log('Seeding Longbox Comics demo data...');

  await ensurePermissionsCatalog();

  const account = await ensureAccount();
  const [owner] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, OWNER_EMAIL));
  await ensureOwnerRole(account.id, owner.id);

  const location = await ensureDefaultLocation(account.id);
  await ensureApiKey(account.id);

  const brandsByName = await ensureBrands(account.id);
  const categoriesByName = await ensureCategories(account.id);

  let created = 0;
  let skipped = 0;
  for (const product of PRODUCTS) {
    const didCreate = await ensureProduct(
      product,
      account.id,
      location.id,
      brandsByName,
      categoriesByName,
    );
    if (didCreate) created++;
    else skipped++;
  }

  console.log(`Done. ${created} product(s) created, ${skipped} already existed.`);
  console.log(`Sign in at shop-admin-web with ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
