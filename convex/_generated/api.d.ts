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
import type * as lib_otpEmail from "../lib/otpEmail.js";
import type * as movies from "../movies.js";
import type * as nights from "../nights.js";
import type * as nightsActions from "../nightsActions.js";
import type * as nightsReminders from "../nightsReminders.js";
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
  "lib/otpEmail": typeof lib_otpEmail;
  movies: typeof movies;
  nights: typeof nights;
  nightsActions: typeof nightsActions;
  nightsReminders: typeof nightsReminders;
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

export declare const components: {};
