using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using static System.Environment;

namespace Cloud_Launcher_v2

{
    static class EpicGames
    {
        #region Class Region

        public class Installed
        {
            public class Installation
            {
                [JsonProperty("InstallLocation")]
                public string InstallLocation { get; set; }

                [JsonProperty("AppName")]
                public string AppName { get; set; }
                [JsonProperty("AppVersion")]
                public string AppVersion { get; set; }
            }

            [JsonProperty("InstallationList")]
            public Installation[] InstallationList { get; set; }
        }

        #endregion

        #region Property Region

        public static Installed LauncherInstalled => GetLauncherInstalled();

        #endregion

        #region Method Region

        static Installed GetLauncherInstalled()
        {
            var path = Path.Combine(GetFolderPath(SpecialFolder.CommonApplicationData),
                "Epic\\UnrealEngineLauncher\\LauncherInstalled.dat");

            if (!File.Exists(path))
                return new Installed();
            else
                return JsonConvert.DeserializeObject<Installed>(File.ReadAllText(path));
        }

        #endregion
    }
}
