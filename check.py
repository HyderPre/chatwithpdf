# import psycopg2

# connection = psycopg2.connect(
#     host="dpg-cvnteapr0fns73eh7cm0-a.oregon-postgres.render.com",
#     database="chat_db_a0sk",
#     user="chat_db_a0sk_user",
#     password="Tzu0KrqMYIuB7qfoOByTmJ3yXrASvlWA"
# )

# cursor = connection.cursor()

# # Show all table names (just to double-check)
# cursor.execute("""SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';""")
# print("All tables:", cursor.fetchall())

# # Show columns in user table
# cursor.execute("""SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user';""")
# print("\n'user' table columns:")
# for col in cursor.fetchall():
#     print(col)

# # Try selecting from user table
# print("\nUser table content:")
# cursor.execute("SELECT * FROM user")
# rows = cursor.fetchall()
# for row in rows:
#     print(row)

# cursor.close()
# connection.close()
