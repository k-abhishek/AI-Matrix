import React from "react";
import { HealthData } from "../types";
import Card from "./ui/Card";
import StatusBadge from "./ui/StatusBadge";
import { formatUptime, formatDate } from "../utils/helpers";

interface HealthCardProps {
  health: HealthData;
}

const HealthCard: React.FC<HealthCardProps> = ({ health }) => {
  return (
    <Card title="Server Health">
      <dl className="divide-y divide-gray-100">
        <div className="flex items-center justify-between py-3">
          <dt className="text-sm font-medium text-foreground">Status</dt>
          <dd>
            <StatusBadge
              status={health.status}
              variant={health.status === "ok" ? "success" : "error"}
            />
          </dd>
        </div>
        {/* <div className="flex items-center justify-between py-3">
          <dt className="text-sm font-medium text-gray-500">Environment</dt>
          <dd className="text-sm font-semibold text-gray-900 capitalize">{health.environment}</dd>
        </div> */}
        <div className="flex items-center justify-between py-3">
          <dt className="text-sm font-medium text-foreground">Uptime</dt>
          <dd className="text-sm font-semibold text-foreground">
            {formatUptime(health.uptime)}
          </dd>
        </div>
        <div className="flex items-center justify-between py-3">
          <dt className="text-sm font-medium text-foreground">Last Checked</dt>
          <dd className="text-sm text-foreground">
            {formatDate(health.timestamp)}
          </dd>
        </div>
      </dl>
    </Card>
  );
};

export default HealthCard;
