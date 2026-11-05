import { useCluster } from "./cluster-data-access";
import { RadioButton, Text } from "react-native-paper";
import { ClusterPickerRadioButtonGroupRow } from "./cluster-ui";

export default function ClusterPickerFeature() {
  const { selectedCluster, clusters, setSelectedCluster } = useCluster();

  return (
    <>
      <Text variant="headlineMedium">Cluster:</Text>
      <RadioButton.Group
        onValueChange={(newClusternetwork) =>
          setSelectedCluster(clusters.find((cluster) => cluster.network === newClusternetwork)!)
        }
        value={selectedCluster.network}
      >
        {clusters.map((cluster) => (
          <ClusterPickerRadioButtonGroupRow key={cluster.network} cluster={cluster} />
        ))}
      </RadioButton.Group>
    </>
  );
}
