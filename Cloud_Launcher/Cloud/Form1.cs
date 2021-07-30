using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using WindowsFormsApp1.files;
using WindowsFormsApp1.Properties;

namespace WindowsFormsApp1
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
            this.EmailBox.Text = Settings.Default.Email;
            this.PasswordBox.Text = Settings.Default.Password;
            this.PathBox.Text = Settings.Default.GamePath;
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            // gets fltoken and shit
            // not atm
        }

        public static Process StartProcess(string path, bool shouldFreeze, string extraArgs = "")
        {
            Process process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = path,
                    Arguments = $"-epicapp=Fortnite -epicenv=Prod -epiclocale=en-us -epicportal -noeac -fromfl=be -fltoken=5dh74c635862g575778132fb -skippatchcheck" + extraArgs
                }
            };
            process.Start();
            if (shouldFreeze)
            {
                foreach (object obj in process.Threads)
                {
                    ProcessThread thread = (ProcessThread)obj;
                    Win32.SuspendThread(Win32.OpenThread(2, false, thread.Id));
                }
            }
            return process;
        }

        private void button2_Click(object sender, EventArgs e)
        {
            var clientPath = Path.Combine(PathBox.Text, $"FortniteGame\\Binaries\\Win64\\{stringvalues.ClientExecutable}");

            if (!File.Exists(clientPath))
            {
                MessageBox.Show($"\"{stringvalues.ClientExecutable}\" was not found, please make sure it exists.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            var nativePath = Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), stringvalues.dll);

            if (!File.Exists(nativePath))
            {
                MessageBox.Show($"\"{stringvalues.dll}\" was not found, please make sure it exists.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
            // need to find a better start // credits to rift for this part
            Process process = StartProcess(PathBox.Text + "\\FortniteGame\\Binaries\\Win64\\FortniteLauncher.exe", true, "-NOSSLPINNING");
            Process process2 = StartProcess(PathBox.Text + "\\FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping_BE.exe", true, "");
            Process process3 = StartProcess(PathBox.Text + "\\FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping.exe", false, $"-AUTH_TYPE=epic -AUTH_LOGIN={EmailBox.Text} -AUTH_PASSWORD={PasswordBox.Text}");
            process3.WaitForInputIdle();
            base.Hide();
            inject.InjectDll(process3.Id, Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), stringvalues.dll)); // change this in the stringvalues.cs or do "Yourdll.dll"
            process3.WaitForExit();
            base.Show();
            MessageBox.Show("Thanks for using cloud!");
        }
    }
}
