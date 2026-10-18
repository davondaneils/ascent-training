import { CampaignRoadmap } from "@/components/campaign/campaign-roadmap";
import { serverNow } from "@/lib/clock";
import { getAppContext } from "@/lib/data/context";
import { toLocalDate } from "@/lib/dates";
import { campaignPosition } from "@/lib/campaign/schedule";

export default async function CampaignPage() {
  const { enrollment } = await getAppContext();
  const today = toLocalDate(await serverNow());
  return <CampaignRoadmap position={campaignPosition(enrollment!.startDate, today)} />;
}
