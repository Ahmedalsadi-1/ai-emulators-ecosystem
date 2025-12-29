# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e4]:
        - link "KRONOS" [ref=e5] [cursor=pointer]:
          - /url: /
          - img "KRONOS" [ref=e6]
        - generic [ref=e8]:
          - link "Home" [ref=e9] [cursor=pointer]:
            - /url: /
          - link "Tasks" [ref=e10] [cursor=pointer]:
            - /url: /tasks
          - link "Desktop" [ref=e11] [cursor=pointer]:
            - /url: /desktop
          - link "Settings" [ref=e12] [cursor=pointer]:
            - /url: /settings
    - main [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e18]:
          - img "Live view status" [ref=e21]
          - generic [ref=e23]: Live Desktop View
        - button "Live Command" [ref=e30]:
          - generic [ref=e31]:
            - generic [ref=e33]: Live
            - img [ref=e34]
            - generic [ref=e36]: Command
        - generic [ref=e37]:
          - button "↻ Restart" [ref=e38]
          - button "⚙ Settings" [ref=e39]
  - alert [ref=e40]
```