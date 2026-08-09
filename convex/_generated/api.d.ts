/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as auth from "../auth.js";
import type * as collections from "../collections.js";
import type * as http from "../http.js";
import type * as lib_avatars from "../lib/avatars.js";
import type * as lib_customFunctions from "../lib/customFunctions.js";
import type * as lib_easternProvinceRestaurants from "../lib/easternProvinceRestaurants.js";
import type * as lib_inviteEmail from "../lib/inviteEmail.js";
import type * as lib_orgConstants from "../lib/orgConstants.js";
import type * as lib_orgs from "../lib/orgs.js";
import type * as lib_otpEmail from "../lib/otpEmail.js";
import type * as lib_seedCollections from "../lib/seedCollections.js";
import type * as lib_users from "../lib/users.js";
import type * as migrations from "../migrations.js";
import type * as movies from "../movies.js";
import type * as nights from "../nights.js";
import type * as nightsActions from "../nightsActions.js";
import type * as nightsReminders from "../nightsReminders.js";
import type * as organizationInvites from "../organizationInvites.js";
import type * as organizations from "../organizations.js";
import type * as restaurants from "../restaurants.js";
import type * as stats from "../stats.js";
import type * as users from "../users.js";
import type * as watched from "../watched.js";
import type * as watchlist from "../watchlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  auth: typeof auth;
  collections: typeof collections;
  http: typeof http;
  "lib/avatars": typeof lib_avatars;
  "lib/customFunctions": typeof lib_customFunctions;
  "lib/easternProvinceRestaurants": typeof lib_easternProvinceRestaurants;
  "lib/inviteEmail": typeof lib_inviteEmail;
  "lib/orgConstants": typeof lib_orgConstants;
  "lib/orgs": typeof lib_orgs;
  "lib/otpEmail": typeof lib_otpEmail;
  "lib/seedCollections": typeof lib_seedCollections;
  "lib/users": typeof lib_users;
  migrations: typeof migrations;
  movies: typeof movies;
  nights: typeof nights;
  nightsActions: typeof nightsActions;
  nightsReminders: typeof nightsReminders;
  organizationInvites: typeof organizationInvites;
  organizations: typeof organizations;
  restaurants: typeof restaurants;
  stats: typeof stats;
  users: typeof users;
  watched: typeof watched;
  watchlist: typeof watchlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
};
