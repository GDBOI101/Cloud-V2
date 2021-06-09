using CloudLauncher;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Cloud_Launcher_v2
{
    partial class Form3 : Form
    {
        class Installed
        {


            public class Installation
            {
                public string InstallLocation { get; set; }

                public string AppName { get; set; }
                public string AppVersion { get; set; }
            }

            public Installation[] InstallationList { get; set; }
        }


        static Process _clientProcess;
        /// <summary>
        /// 0 = None, 1 = BattlEye, 2 = EasyAntiCheat
        /// </summary>
        static byte _clientAnticheat;

        public Configuration Configuration;
        public Form3()
        {
            InitializeComponent();

            Configuration = new Configuration();
            Configuration.Open();

            UserName.Text = Configuration.Email;
            Password.Text = Configuration.Password;
            FortnitePath.Text = Configuration.InstallLocation;
        }

        private bool IsValidPath(string path)
        {
            var drive = new Regex(@"^[a-zA-Z]:\\$");
            if (!drive.IsMatch(path.Substring(0, 3)))
                return false;

            var invalidCharacters = new string(Path.GetInvalidPathChars());
            invalidCharacters += @":/?*" + "\"";

            var badCharacter = new Regex("[" + Regex.Escape(invalidCharacters) + "]");
            if (badCharacter.IsMatch(path.Substring(3, path.Length - 3)))
                return false;

            return true;
        }

        private void button1_Click(object sender, EventArgs e)
        {
            var clientPath = Path.Combine(this.Configuration.InstallLocation, $"FortniteGame\\Binaries\\Win64\\{Configuration.ClientExecutable}");

            if (!File.Exists(clientPath))
            {
                MessageBox.Show($"\"{Configuration.ClientExecutable}\" was not found, please make sure it exists.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            var nativePath = Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), Configuration.LauncherNative);

            if (!File.Exists(nativePath))
            {
                MessageBox.Show($"\"{Configuration.LauncherNative}\" was not found, please make sure it exists.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            var formattedArguments = $"-AUTH_LOGIN={UserName.Text} -AUTH_PASSWORD={Password.Text} -AUTH_TYPE=epic";

#if FDEV
            _clientAnticheat = 2;
#endif

            if (_clientAnticheat == 0) // None
                formattedArguments += $" {Configuration.ClientArguments} -noeac -nobe -fltoken=none";
            else if (_clientAnticheat == 1) // BattlEye
                formattedArguments += $" {Configuration.ClientArguments} -noeac -fromfl=be -fltoken={Configuration.BEToken}";
            else if (_clientAnticheat == 2) // EasyAntiCheat
                formattedArguments += $" {Configuration.ClientArguments} -nobe -fromfl=eac -fltoken={Configuration.EACToken}";

            _clientProcess = new Process
            {
                StartInfo = new ProcessStartInfo(clientPath, formattedArguments)
                {
                    UseShellExecute = false,

                    RedirectStandardOutput = true,

                    CreateNoWindow = false
                }
            };

            _clientProcess.Start();

            var clientHandle = Win32.OpenProcess(Win32.PROCESS_CREATE_THREAD | Win32.PROCESS_QUERY_INFORMATION |
                Win32.PROCESS_VM_OPERATION | Win32.PROCESS_VM_WRITE | Win32.PROCESS_VM_READ, false, _clientProcess.Id);

            var loadLibrary = Win32.GetProcAddress(Win32.GetModuleHandle("kernel32.dll"), "LoadLibraryA");

            var size = (uint)((nativePath.Length + 1) * Marshal.SizeOf(typeof(char)));
            var address = Win32.VirtualAllocEx(clientHandle, IntPtr.Zero,
                size, Win32.MEM_COMMIT | Win32.MEM_RESERVE, Win32.PAGE_READWRITE);

            Win32.WriteProcessMemory(clientHandle, address,
                Encoding.Default.GetBytes(nativePath), size, out UIntPtr bytesWritten);

            Win32.CreateRemoteThread(clientHandle, IntPtr.Zero, 0, loadLibrary, address, 0, IntPtr.Zero);
        }

        private void button2_Click(object sender, EventArgs e)
        {
            try
            {
                if (!IsValidPath(FortnitePath.Text))
                {
                    MessageBox.Show("Invalid Fortnite path.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }
            }
            catch
            {
                MessageBox.Show("Invalid Fortnite path.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            var clientPath = Path.Combine(this.Configuration.InstallLocation, $"FortniteGame\\Binaries\\Win64\\{Configuration.ClientExecutable}");

            if (!File.Exists(clientPath))
            {
                MessageBox.Show($"\"{Configuration.ClientExecutable}\" was not found, please make sure it exists.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
            Process process = ProcessHelper.StartProcess(this.Configuration.InstallLocation + "\\FortniteGame\\Binaries\\Win64\\FortniteLauncher.exe", true, "-NOSSLPINNING");
            Process process2 = ProcessHelper.StartProcess(this.Configuration.InstallLocation + "\\FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping_BE.exe", true, "");
            Process process3 = ProcessHelper.StartProcess(this.Configuration.InstallLocation + "\\FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping.exe", false, $"-AUTH_TYPE=epic -AUTH_LOGIN={UserName.Text} -AUTH_PASSWORD={Password.Text}");
            process3.WaitForInputIdle();
            base.Hide();
            ProcessHelper.InjectDll(process3.Id, Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), "Cloud.Runtime.dll"));

            process3.WaitForExit();
            base.Show();
            process.Kill();
            process2.Kill();
            MessageBox.Show("Thx for using cloud.");
        }
    }
}
