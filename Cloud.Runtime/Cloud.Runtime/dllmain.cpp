/**
 * All Rights Reserved. Licensed under Cloud License
 * https://cloudfn.dev/CLICENSE
 */
#include "pch.h"
#include "util.h"
#include "curlhook.h"
BOOL APIENTRY DllMain( HMODULE hModule,
                       DWORD  reason,
                       LPVOID lpReserved
                     )
{
    switch (reason)
    {
    case DLL_PROCESS_ATTACH:
        Util::InitConsole();
        printf("Welcome to CloudFN! \n");
        EnableCurlHook();
    case DLL_THREAD_ATTACH:
    case DLL_THREAD_DETACH:
    case DLL_PROCESS_DETACH:
        break;
    }
    return TRUE;
}

