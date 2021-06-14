/**
 * All Rights Reserved. Licensed under Cloud License
 * https://cloudfn.dev/CLICENSE
 */
#pragma once
#include "pch.h"
#include <winscard.h>
#define RELATIVE_ADDRESS(address, size) ((PBYTE)((UINT_PTR)(address) + *(PINT)((UINT_PTR)(address) + ((size) - sizeof(INT))) + (size)))

#define READ_POINTER(base, offset) (*(PVOID *)(((PBYTE)base + offset)))

#define READ_DWORD(base, offset) (*(PDWORD)(((PBYTE)base + offset)))

#define GET_POINTER(base, offset) *reinterpret_cast<PVOID*>((static_cast<PBYTE>(base) + offset));

class Util {
private:
    static  BOOL MaskCompare(PVOID pBuffer, LPCSTR lpPattern, LPCSTR lpMask) {
        for (auto value = reinterpret_cast<PBYTE>(pBuffer); *lpMask; ++lpPattern, ++lpMask, ++value) {
            if (*lpMask == 'x' && *reinterpret_cast<LPCBYTE>(lpPattern) != *value)
                return false;
        }

        return true;
    }

public:

    static __forceinline bool IsBadReadPtr(void* p)
    {
        MEMORY_BASIC_INFORMATION mbi;
        if (VirtualQuery(p, &mbi, sizeof(mbi)))
        {
            DWORD mask = (PAGE_READONLY | PAGE_READWRITE | PAGE_WRITECOPY | PAGE_EXECUTE_READ | PAGE_EXECUTE_READWRITE | PAGE_EXECUTE_WRITECOPY);
            bool b = !(mbi.Protect & mask);
            if (mbi.Protect & (PAGE_GUARD | PAGE_NOACCESS)) b = true;

            return b;
        }
        return true;
    }

    static  VOID InitConsole() {
        FILE* pFile;
        AllocConsole();
        freopen_s(&pFile, "CONOUT$", "w", stdout);
    }

    static  PBYTE FindPattern(PVOID pBase, DWORD dwSize, LPCSTR lpPattern, LPCSTR lpMask) {
        dwSize -= static_cast<DWORD>(strlen(lpMask));

        for (auto index = 0UL; index < dwSize; ++index) {
            auto pAddress = reinterpret_cast<PBYTE>(pBase) + index;

            if (MaskCompare(pAddress, lpPattern, lpMask))
                return pAddress;
        }

        return NULL;
    }

    static  PBYTE FindPattern(LPCSTR lpPattern, LPCSTR lpMask) {
        MODULEINFO info = { 0 };

        GetModuleInformation(GetCurrentProcess(), GetModuleHandle(0), &info, sizeof(info));

        return FindPattern(info.lpBaseOfDll, info.SizeOfImage, lpPattern, lpMask);
    }
};
