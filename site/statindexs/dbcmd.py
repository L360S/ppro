import sqlite3
import pandas as pd

# 1. Load the Excel file
excel_file = 'ufcstats_revised_v5_twelfth7.xlsx'
df = pd.read_excel(excel_file)

# 2. Add an 'id' column starting at 0
df.insert(0, 'id', range(0, len(df)))

# 3. Connect to SQLite database
conn = sqlite3.connect('stats.db')

# 4. Export to SQLite (include the new 'id' column)
df.to_sql('fighters', conn, if_exists='replace', index=False)

conn.close()

print("Database updated with 'id' column starting from 0!")