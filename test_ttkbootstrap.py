#!/usr/bin/env python3
"""
Test script to reproduce ttkbootstrap compatibility issue
"""

import tkinter as tk
import ttkbootstrap as ttk


def test_ttkbootstrap():
    """Test ttkbootstrap to see if the W attribute error occurs"""
    print("Testing ttkbootstrap attributes...")

    # Test tk.W
    try:
        w_value = tk.W
        print(f"tk.W = {w_value}")
    except AttributeError as e:
        print(f"tk.W error: {e}")

    # Test ttk.W (this should fail)
    try:
        w_value = ttk.W
        print(f"ttk.W = {w_value}")
    except AttributeError as e:
        print(f"ttk.W error: {e}")

    # Test if ttk has the tkinter constants
    print(f"ttk.__dict__ keys: {list(ttk.__dict__.keys())}")

    # Check if ttk has W
    if hasattr(ttk, "W"):
        print("ttk has W attribute")
    else:
        print("ttk does NOT have W attribute")


if __name__ == "__main__":
    test_ttkbootstrap()
