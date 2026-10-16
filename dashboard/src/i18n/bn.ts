// Bangla for the dashboard. The key is the English text exactly as written in the code.
// Anything that is missing here is simply shown in English.
import { care } from "./bn/care";
import { catalog } from "./bn/catalog";
import { common } from "./bn/common";
import { delivery } from "./bn/delivery";
import { misc } from "./bn/misc";
import { more } from "./bn/more";
import { reports } from "./bn/reports";
import { orders } from "./bn/orders";

export const bn: Record<string, string> = { ...common, ...orders, ...delivery, ...misc, ...more, ...reports, ...catalog, ...care };
