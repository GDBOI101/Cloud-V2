using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace WindowsFormsApp1.files
{
    class inject
    {
        public static int InjectDll(int processId, string dllPath)
        {
            IntPtr hProcess = Win32.OpenProcess(1082, false, processId);
            IntPtr procAddress = Win32.GetProcAddress(Win32.GetModuleHandle("Kernel32.dll"), "LoadLibraryA");
            IntPtr intPtr = Win32.VirtualAllocEx(hProcess, IntPtr.Zero, (uint)((dllPath.Length + 1) * Marshal.SizeOf(typeof(char))), 12288U, 4U);
            UIntPtr uIntPtr;
            Win32.WriteProcessMemory(hProcess, intPtr, Encoding.Default.GetBytes(dllPath), (uint)((dllPath.Length + 1) * Marshal.SizeOf(typeof(char))), out uIntPtr);
            Win32.CreateRemoteThread(hProcess, IntPtr.Zero, 0U, procAddress, intPtr, 0U, IntPtr.Zero);
            return 0;
        }
    }
}
